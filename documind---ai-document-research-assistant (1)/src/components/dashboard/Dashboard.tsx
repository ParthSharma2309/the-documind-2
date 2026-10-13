import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen,
  Activity,
  Calendar,
} from 'lucide-react';
import { DocumentRecord, ConversationRecord } from '../../types/index.ts';
import { StatusBadge } from '../ui/Badge.tsx';
import { Dropzone } from '../documents/Dropzone.tsx';

interface DashboardProps {
  documents: DocumentRecord[];
  conversations: ConversationRecord[];
  onNavigate: (tab: 'workspace' | 'documents' | 'evaluation' | 'settings') => void;
  onOpenDocument: (docId: string) => void;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  conversations,
  onNavigate,
  onOpenDocument,
  onRefresh,
}) => {
  const readyDocs = documents.filter((d) => d.status === 'Ready');
  const processingOrFailed = documents.filter(
    (d) => d.status === 'Processing' || d.status === 'Failed'
  );
  const totalPagesIndexed = readyDocs.reduce((acc, d) => acc + (d.pageCount || 0), 0);

  const recentDocs = [...documents].sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 4);
  const recentConvs = [...conversations].slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3 backdrop-blur-xs">
            <Sparkles size={13} className="text-indigo-300" />
            <span>AI Document Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Research your documents. Verify every answer.
          </h1>
          <p className="text-xs md:text-sm text-indigo-200/90 mt-2 leading-relaxed">
            Upload PDFs to extract text, generate vector embeddings, and ask questions with strict page-level citation verification.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="inline-flex items-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>Start Research Session</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="inline-flex items-center gap-2 bg-indigo-700/60 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold border border-indigo-500/40 transition-colors cursor-pointer"
            >
              <FileText size={14} />
              <span>Manage Documents</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real Count Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Documents</span>
            <FileText size={18} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{documents.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">In local IndexedDB</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ready for Q&A</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{readyDocs.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalPagesIndexed} indexed pages
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attention Needed</span>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {processingOrFailed.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Processing or failed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Research Chats</span>
            <MessageSquare size={18} className="text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{conversations.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Stored with citations</span>
        </div>
      </div>

      {/* Quick Upload Dropzone */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Quick Ingestion
          </h2>
          <span className="text-xs text-slate-500">Extracts text and embeds with Gemini</span>
        </div>
        <Dropzone onUploadSuccess={onRefresh} compact />
      </div>

      {/* Two Column Layout: Recent Documents & Recent Conversations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Documents</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              View all
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No documents yet. Use the upload box above to add your first PDF.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200/60 transition-colors"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {doc.pageCount} pages • {(doc.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status} size="sm" />
                    {doc.status === 'Ready' && (
                      <button
                        type="button"
                        onClick={() => onOpenDocument(doc.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-violet-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Conversations</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Open Workspace
            </button>
          </div>

          {recentConvs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No conversations yet. Open the workspace to ask your first question.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentConvs.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onNavigate('workspace')}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {conv.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Updated {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
