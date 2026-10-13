import { ChunkRecord, RetrievalScope, RetrievalScore } from '../types/index.ts';
import { MODEL_CONFIG } from '../config/models.ts';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Checks if a user question is a broad or comparative query
 */
export function isBroadOrComparativeQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  const broadPatterns = [
    /\bsummar(y|ize|ization)\b/,
    /\boverview\b/,
    /\bmain argument(s)?\b/,
    /\bkey (findings|points|themes|takeaways|conclusions)\b/,
    /\bcompare\b/,
    /\bcontrast\b/,
    /\bdifference(s)? between\b/,
    /\bwhat is this document about\b/,
    /\ball documents\b/,
    /\bhigh level\b/,
    /\btable of contents\b/,
    /\bexecutive summary\b/,
  ];
  return broadPatterns.some((pattern) => pattern.test(q));
}

export interface RetrievedChunk {
  chunk: ChunkRecord;
  score: number;
}

export interface RetrievalResult {
  topChunks: RetrievedChunk[];
  maxScore: number;
  scores: RetrievalScore[];
  isBroadQuery: boolean;
}

/**
 * Retrieves top-k chunks matching the query embedding, filtered by scope and balanced if broad query.
 */
export function retrieveRelevantChunks(
  queryEmbedding: number[],
  allChunks: ChunkRecord[],
  scope: RetrievalScope,
  validDocIds: Set<string>,
  topK: number = MODEL_CONFIG.defaultTopK,
  queryText: string = ''
): RetrievalResult {
  // 1. Filter chunks by scope
  let candidateChunks = allChunks.filter((chunk) => validDocIds.has(chunk.documentId));

  if (scope.type === 'selected') {
    const selectedSet = new Set(scope.documentIds);
    candidateChunks = candidateChunks.filter((chunk) => selectedSet.has(chunk.documentId));
  }

  if (candidateChunks.length === 0) {
    return {
      topChunks: [],
      maxScore: 0,
      scores: [],
      isBroadQuery: false,
    };
  }

  // 2. Score all candidate chunks using cosine similarity
  const scoredChunks: RetrievedChunk[] = candidateChunks.map((chunk) => {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      chunk,
      score,
    };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  const maxScore = scoredChunks[0]?.score || 0;
  const isBroad = isBroadOrComparativeQuery(queryText);
  const targetK = isBroad ? Math.max(topK, MODEL_CONFIG.broadQueryTopK) : topK;

  let selectedChunks: RetrievedChunk[] = [];

  if (isBroad) {
    // Balanced retrieval across distinct documents
    const chunksByDoc = new Map<string, RetrievedChunk[]>();
    for (const item of scoredChunks) {
      const docId = item.chunk.documentId;
      if (!chunksByDoc.has(docId)) {
        chunksByDoc.set(docId, []);
      }
      chunksByDoc.get(docId)!.push(item);
    }

    const docIds = Array.from(chunksByDoc.keys());
    let round = 0;
    while (selectedChunks.length < targetK) {
      let addedInRound = 0;
      for (const docId of docIds) {
        const docChunks = chunksByDoc.get(docId)!;
        if (round < docChunks.length) {
          selectedChunks.push(docChunks[round]);
          addedInRound++;
          if (selectedChunks.length >= targetK) break;
        }
      }
      if (addedInRound === 0) break; // no more chunks available in any document
      round++;
    }
    // Re-sort selected chunks by score for consistent marker ordering
    selectedChunks.sort((a, b) => b.score - a.score);
  } else {
    selectedChunks = scoredChunks.slice(0, targetK);
  }

  const scores: RetrievalScore[] = selectedChunks.map((item) => ({
    chunkId: item.chunk.id,
    documentId: item.chunk.documentId,
    documentName: item.chunk.documentName,
    pageNumber: item.chunk.pageNumber,
    score: Number(item.score.toFixed(4)),
    preview: item.chunk.text.slice(0, 150) + (item.chunk.text.length > 150 ? '...' : ''),
  }));

  return {
    topChunks: selectedChunks,
    maxScore,
    scores,
    isBroadQuery: isBroad,
  };
}
