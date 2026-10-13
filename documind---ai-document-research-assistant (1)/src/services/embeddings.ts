import { ChunkRecord } from '../types/index.ts';
import { MODEL_CONFIG } from '../config/models.ts';

export interface EmbedChunksOptions {
  model?: string;
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Fetches embeddings from the backend API for a list of chunks in batches with progress tracking.
 */
export async function embedChunks(
  chunks: Omit<ChunkRecord, 'embedding'>[],
  options: EmbedChunksOptions = {}
): Promise<ChunkRecord[]> {
  const model = options.model || MODEL_CONFIG.defaultEmbeddingModel;
  const batchSize = options.batchSize || 10;
  const total = chunks.length;

  if (total === 0) return [];

  const results: ChunkRecord[] = [];
  let completed = 0;

  for (let i = 0; i < total; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const texts = slice.map((c) => c.text);

    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        model,
      }),
    });

    if (!res.ok) {
      let errorMsg = `Embedding request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const embeddings: number[][] = data.embeddings;

    if (!embeddings || embeddings.length !== slice.length) {
      throw new Error(`Embedding count mismatch: expected ${slice.length}, got ${embeddings?.length || 0}`);
    }

    for (let j = 0; j < slice.length; j++) {
      results.push({
        ...slice[j],
        embedding: embeddings[j],
        model,
      });
    }

    completed += slice.length;
    if (options.onProgress) {
      options.onProgress(completed, total);
    }
  }

  return results;
}

/**
 * Generates an embedding for a single query string.
 */
export async function embedQuery(
  query: string,
  model: string = MODEL_CONFIG.defaultEmbeddingModel
): Promise<number[]> {
  const res = await fetch('/api/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [query],
      model,
    }),
  });

  if (!res.ok) {
    let errorMsg = `Query embedding failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (!data.embeddings || !data.embeddings[0]) {
    throw new Error('Failed to retrieve query vector from embedding service');
  }

  return data.embeddings[0];
}
