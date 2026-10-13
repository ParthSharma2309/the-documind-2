import { DocumentRecord } from '../types/index.ts';
import { extractTextFromPDF } from './pdf.ts';
import { chunkDocumentPages } from './chunking.ts';
import { embedChunks } from './embeddings.ts';
import {
  saveDocument,
  updateDocumentStatus,
  saveChunks,
  deleteChunksByDocument,
  getSettings,
  getDocumentBlob,
  getDocumentById,
} from './storage.ts';

export interface ProcessDocumentOptions {
  collectionId?: string;
  onProgress?: (progress: number, stepText: string) => void;
}

/**
 * Handles the complete document ingestion lifecycle:
 * Uploaded -> Processing (Extracting -> Chunking -> Embedding) -> Ready or Failed.
 */
export async function processPDFFile(
  file: File | Blob,
  fileName: string,
  options: ProcessDocumentOptions = {}
): Promise<DocumentRecord> {
  const settings = await getSettings();
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const initialDoc: DocumentRecord = {
    id: docId,
    name: fileName,
    size: file.size,
    pageCount: 0,
    collectionId: options.collectionId,
    status: 'Processing',
    statusMessage: 'Validating and reading PDF...',
    progress: 5,
    processingStep: 'validating',
    extractedCharacters: 0,
    avgCharactersPerPage: 0,
    uploadedAt: Date.now(),
    modelUsed: settings.embeddingModel,
    hasExtractableText: true,
  };

  // Save document and blob to IndexedDB
  await saveDocument(initialDoc, file);

  try {
    // 1. Text Extraction
    await updateDocumentStatus(docId, {
      processingStep: 'extracting',
      statusMessage: 'Extracting page text with PDF.js...',
      progress: 15,
    });
    options.onProgress?.(15, 'Extracting text...');

    const extractionResult = await extractTextFromPDF(
      file,
      settings.maxFileSizeMB,
      (pagesDone, totalPages) => {
        const pct = Math.round(15 + (pagesDone / totalPages) * 35);
        options.onProgress?.(pct, `Extracting page ${pagesDone} of ${totalPages}...`);
      }
    );

    // Check if empty or scanned (average chars per page < threshold)
    if (!extractionResult.hasExtractableText) {
      await updateDocumentStatus(docId, {
        status: 'Failed',
        statusMessage: extractionResult.statusMessage || 'No extractable text (OCR not supported)',
        pageCount: extractionResult.numPages,
        extractedCharacters: extractionResult.totalCharacters,
        avgCharactersPerPage: extractionResult.avgCharactersPerPage,
        hasExtractableText: false,
        processingStep: 'failed',
        progress: 100,
      });
      throw new Error(
        `Document has no extractable text (${extractionResult.avgCharactersPerPage} avg chars/page). Scanned PDFs requiring OCR are not supported.`
      );
    }

    // 2. Chunking
    await updateDocumentStatus(docId, {
      processingStep: 'chunking',
      statusMessage: 'Splitting text into page-level chunks...',
      pageCount: extractionResult.numPages,
      extractedCharacters: extractionResult.totalCharacters,
      avgCharactersPerPage: extractionResult.avgCharactersPerPage,
      progress: 55,
    });
    options.onProgress?.(55, 'Chunking pages...');

    const rawChunks = chunkDocumentPages(docId, fileName, extractionResult.pages, {
      chunkSize: settings.chunkSize,
      chunkOverlap: settings.chunkOverlap,
    });

    if (rawChunks.length === 0) {
      throw new Error('Document produced zero readable text chunks.');
    }

    // 3. Batched Embedding
    await updateDocumentStatus(docId, {
      processingStep: 'embedding',
      statusMessage: `Generating Gemini embeddings (0/${rawChunks.length})...`,
      progress: 60,
    });
    options.onProgress?.(60, `Generating embeddings (0/${rawChunks.length})...`);

    const embeddedChunks = await embedChunks(rawChunks, {
      model: settings.embeddingModel,
      batchSize: 10,
      onProgress: (done, total) => {
        const pct = Math.round(60 + (done / total) * 38);
        const msg = `Embedding passages with Gemini (${done}/${total})...`;
        updateDocumentStatus(docId, {
          progress: pct,
          statusMessage: msg,
        });
        options.onProgress?.(pct, msg);
      },
    });

    // 4. Save Chunks to IndexedDB
    await saveChunks(embeddedChunks);

    // 5. Mark as Ready
    const finalDoc: DocumentRecord = {
      ...initialDoc,
      pageCount: extractionResult.numPages,
      extractedCharacters: extractionResult.totalCharacters,
      avgCharactersPerPage: extractionResult.avgCharactersPerPage,
      status: 'Ready',
      statusMessage: 'Indexed & ready for research',
      progress: 100,
      processingStep: 'complete',
    };
    await updateDocumentStatus(docId, finalDoc);
    options.onProgress?.(100, 'Ready');

    return finalDoc;
  } catch (error: any) {
    console.error('Document processing failed:', error);
    await updateDocumentStatus(docId, {
      status: 'Failed',
      statusMessage: error.message || 'Processing failed',
      processingStep: 'failed',
    });
    throw error;
  }
}

/**
 * Retries processing for a failed document using the original PDF blob stored in IndexedDB.
 */
export async function retryProcessDocument(
  docId: string,
  onProgress?: (progress: number, stepText: string) => void
): Promise<void> {
  const doc = await getDocumentById(docId);
  const blob = await getDocumentBlob(docId);
  if (!blob) {
    throw new Error('Original PDF blob was not found in storage. Please re-upload the document.');
  }

  const docName = doc?.name || 'document.pdf';

  // Clear existing chunks for this document
  await deleteChunksByDocument(docId);

  const settings = await getSettings();

  await updateDocumentStatus(docId, {
    status: 'Processing',
    statusMessage: 'Retrying processing...',
    processingStep: 'extracting',
    progress: 10,
  });

  try {
    const extractionResult = await extractTextFromPDF(blob, settings.maxFileSizeMB);

    if (!extractionResult.hasExtractableText) {
      await updateDocumentStatus(docId, {
        status: 'Failed',
        statusMessage: extractionResult.statusMessage || 'No extractable text (OCR not supported)',
        processingStep: 'failed',
        progress: 100,
      });
      throw new Error('No extractable text found in this PDF.');
    }

    const rawChunks = chunkDocumentPages(docId, docName, extractionResult.pages, {
      chunkSize: settings.chunkSize,
      chunkOverlap: settings.chunkOverlap,
    });

    await updateDocumentStatus(docId, {
      processingStep: 'embedding',
      statusMessage: `Generating embeddings (0/${rawChunks.length})...`,
      progress: 50,
    });

    const embeddedChunks = await embedChunks(rawChunks, {
      model: settings.embeddingModel,
      onProgress: (done, total) => {
        const pct = Math.round(50 + (done / total) * 45);
        onProgress?.(pct, `Generating embeddings (${done}/${total})...`);
      },
    });

    await saveChunks(embeddedChunks);

    await updateDocumentStatus(docId, {
      status: 'Ready',
      statusMessage: 'Indexed & ready for research',
      progress: 100,
      processingStep: 'complete',
      pageCount: extractionResult.numPages,
      extractedCharacters: extractionResult.totalCharacters,
      avgCharactersPerPage: extractionResult.avgCharactersPerPage,
    });
  } catch (err: any) {
    console.error(`Retry processing failed for ${docId}:`, err);
    await updateDocumentStatus(docId, {
      status: 'Failed',
      statusMessage: err.message || 'Retry processing failed',
      processingStep: 'failed',
    });
    throw err;
  }
}
