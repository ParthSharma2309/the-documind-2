/**
 * DocuMind Central Model & System Configuration
 */

export const MODEL_CONFIG = {
  // Embedding model: Gemini embedding model
  defaultEmbeddingModel: 'gemini-embedding-2-preview',
  supportedEmbeddingModels: [
    { id: 'gemini-embedding-2-preview', name: 'Gemini Embedding 2 Preview (High Dimension / Default)' },
    { id: 'gemini-embedding-2', name: 'Gemini Embedding 2' },
    { id: 'gemini-embedding-001', name: 'Gemini Embedding 001' },
    { id: 'text-embedding-004', name: 'Text Embedding 004' },
  ],

  // Text Generation model: Gemini text model
  defaultGenerationModel: 'gemini-3.1-flash-lite',
  supportedGenerationModels: [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (High Availability & Fast Response)' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (General Text Model)' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Complex Reasoning)' },
  ],

  // Retrieval & Chunking Defaults
  defaultChunkSize: 800, // characters
  defaultChunkOverlap: 150, // characters
  defaultTopK: 6,
  broadQueryTopK: 14, // expanded top-k for broad or comparison questions
  defaultSimilarityThreshold: 0.45, // below this -> outcome 1: No relevant passages

  // File limits
  maxFileSizeMB: 25,
  minAvgCharsPerPage: 50, // if below 50 chars/page, mark as scanned/OCR not supported
} as const;

export const ABSTENTION_MESSAGE =
  "I couldn't find sufficient evidence to answer this question in your selected documents. Try a more specific question or upload a document that covers this topic.";
