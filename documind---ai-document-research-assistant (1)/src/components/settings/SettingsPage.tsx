import React, { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { SettingsState } from '../../types/index.ts';
import { MODEL_CONFIG } from '../../config/models.ts';
import { getSettings, saveSettings, clearAllData } from '../../services/storage.ts';
import { Modal } from '../ui/Modal.tsx';

interface SettingsPageProps {
  onRefreshData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshData }) => {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setShowClearModal(false);
      onRefreshData();
      await loadSettings();
      alert('All local documents, conversations, chunks, and embeddings have been cleared.');
    } catch (err: any) {
      alert(`Failed to clear data: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          System Settings & Parameters
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Tune chunking sizes, similarity thresholds, retrieval Top-K, and model endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Retrieval & Grounding Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Retrieval & Abstention Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top-K */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Top-K Retrieved Chunks</label>
                <span className="font-mono text-xs font-bold text-indigo-600">{settings.topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.topK}
                onChange={(e) =>
                  setSettings({ ...settings, topK: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Number of highest similarity passages retrieved for standard queries (default: 6). Broad questions automatically expand to 14.
              </p>
            </div>

            {/* Relevance Threshold */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Relevance Abstention Threshold</label>
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {settings.similarityThreshold}
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={settings.similarityThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, similarityThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Below this cosine score, the pipeline abstains immediately without invoking the LLM (default: 0.45).
              </p>
            </div>
          </div>
        </div>

        {/* Chunking Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers size={18} className="text-violet-600" />
            <h2 className="text-sm font-bold text-slate-900">Document Chunking (Page-Confined)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chunk Size */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Chunk Size (characters)</label>
                <span className="font-mono text-xs font-bold text-violet-600">
                  {settings.chunkSize} chars
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="1500"
                step="50"
                value={settings.chunkSize}
                onChange={(e) =>
                  setSettings({ ...settings, chunkSize: parseInt(e.target.value, 10) })
                }
                className="w-full accent-violet-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Target text window size. Splitting is strictly confined within individual pages.
              </p>
            </div>

            {/* Chunk Overlap */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Chunk Overlap (characters)</label>
                <span className="font-mono text-xs font-bold text-violet-600">
                  {settings.chunkOverlap} chars
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="25"
                value={settings.chunkOverlap}
                onChange={(e) =>
                  setSettings({ ...settings, chunkOverlap: parseInt(e.target.value, 10) })
                }
                className="w-full accent-violet-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sliding window character overlap for contextual continuity between chunks.
              </p>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Gemini Models Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Embedding Model
              </label>
              <select
                value={settings.embeddingModel}
                onChange={(e) => setSettings({ ...settings, embeddingModel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              >
                {MODEL_CONFIG.supportedEmbeddingModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Used to embed chunk text during ingestion and user queries during search.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Answer Generation Model
              </label>
              <select
                value={settings.generationModel}
                onChange={(e) => setSettings({ ...settings, generationModel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              >
                {MODEL_CONFIG.supportedGenerationModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Generates grounded structured answers with citations via server proxy.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Check size={14} />
              <span>Settings saved to IndexedDB</span>
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* Architecture & Limitations Section */}
      <div className="mt-10 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-slate-600" />
          <h2 className="text-sm font-bold text-slate-800">Architecture & Privacy Guarantees</h2>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Browser-only Execution:</strong> PDF parsing, page extraction, chunking, IndexedDB vector storage, and cosine similarity calculations take place exclusively in your web browser.
          </p>
          <p>
            <strong>Data Privacy:</strong> Your full PDF files never leave your computer. Only chunk text passages and search queries are securely transmitted to the Gemini API for vector embedding and answer synthesis.
          </p>
          <p>
            <strong>No OCR Limitation:</strong> Scanned documents or image-only PDFs without an embedded text layer cannot be parsed (OCR is not supported). Such documents will be flagged with "No extractable text".
          </p>
          <p>
            <strong>Persistent Local State:</strong> All documents, vectors, conversations, and feedback ratings persist reliably in your browser's IndexedDB database across browser sessions and reloads.
          </p>
        </div>
      </div>

      {/* Danger Zone: Clear all data */}
      <div className="mt-8 p-6 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900">Danger Zone: Purge All Local Data</h3>
          <p className="text-xs text-rose-700/80 mt-0.5">
            Deletes all uploaded PDFs, vector chunks, chat history, and evaluation runs from IndexedDB.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowClearModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Trash2 size={14} />
          <span>Clear All Data</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Confirm Purge All Data"
        description="Irreversible local reset"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowClearModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isClearing}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {isClearing ? 'Clearing...' : 'Yes, Delete Everything'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-800">
          This will permanently delete all stored PDFs, vector embeddings, conversations, citations, and evaluation benchmarks from your browser.
        </p>
      </Modal>
    </div>
  );
};
