import * as pdfjsLib from 'pdfjs-dist';
import { MODEL_CONFIG } from '../config/models.ts';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Fallback to CDN if URL resolution fails
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export interface ExtractedPage {
  pageNumber: number; // 1-based
  text: string;
}

export interface PDFExtractionResult {
  numPages: number;
  pages: ExtractedPage[];
  totalCharacters: number;
  avgCharactersPerPage: number;
  hasExtractableText: boolean;
  statusMessage?: string;
}

/**
 * Validate that the file starts with the %PDF magic bytes
 */
export function validatePDFMagicBytes(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 4));
  // ASCII % = 0x25, P = 0x50, D = 0x44, F = 0x46
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

/**
 * Validates and extracts text page by page from an uploaded PDF file
 */
export async function extractTextFromPDF(
  file: File | Blob,
  maxSizeMB: number = MODEL_CONFIG.maxFileSizeMB,
  onProgress?: (pagesCompleted: number, totalPages: number) => void
): Promise<PDFExtractionResult> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${maxSizeMB} MB.`
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  // Validate magic bytes
  if (!validatePDFMagicBytes(arrayBuffer)) {
    throw new Error(
      'Invalid file: The file does not contain valid %PDF magic bytes. Please upload a genuine PDF file.'
    );
  }

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    if (err.name === 'PasswordException' || err.message?.includes('password')) {
      throw new Error(
        'This PDF is encrypted or password-protected. DocuMind cannot process password-locked documents.'
      );
    }
    if (err.name === 'InvalidPDFException' || err.message?.includes('corrupt')) {
      throw new Error(
        'The PDF file is corrupted or could not be decoded. Please verify the document and try again.'
      );
    }
    throw new Error(`Failed to load PDF: ${err.message || 'Unknown error'}`);
  }

  const numPages = pdfDoc.numPages;
  if (numPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  const pages: ExtractedPage[] = [];
  let totalCharacters = 0;

  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Reconstruct text items preserving spaces & line breaks
      let pageText = '';
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ('str' in item) {
          const itemStr = item.str;
          // Check line jump using transform matrix
          if (lastY !== null && 'transform' in item && Math.abs(item.transform[5] - lastY) > 6) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' ';
          }
          pageText += itemStr;
          if ('transform' in item) {
            lastY = item.transform[5];
          }
        }
      }

      // Clean up excessive whitespace within the page
      const cleanedText = pageText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      pages.push({
        pageNumber: pageNum,
        text: cleanedText,
      });

      totalCharacters += cleanedText.length;

      if (onProgress) {
        onProgress(pageNum, numPages);
      }
    }
  } finally {
    try {
      await ((pdfDoc as any).destroy?.() || (pdfDoc as any).cleanup?.());
    } catch {}
  }

  const avgCharactersPerPage = totalCharacters / numPages;
  const hasExtractableText = avgCharactersPerPage >= MODEL_CONFIG.minAvgCharsPerPage;

  let statusMessage: string | undefined = undefined;
  if (!hasExtractableText) {
    statusMessage = 'No extractable text (OCR not supported)';
  }

  return {
    numPages,
    pages,
    totalCharacters,
    avgCharactersPerPage: Math.round(avgCharactersPerPage),
    hasExtractableText,
    statusMessage,
  };
}
