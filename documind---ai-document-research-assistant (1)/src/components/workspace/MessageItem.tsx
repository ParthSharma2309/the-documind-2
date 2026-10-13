import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { MessageRecord, Citation, UserFeedback } from '../../types/index.ts';
import { SafeMarkdown } from '../ui/SafeMarkdown.tsx';
import { StatusBadge } from '../ui/Badge.tsx';
import { updateMessageFeedback } from '../../services/storage.ts';

interface MessageItemProps {
  message: MessageRecord;
  onCitationClick: (citation: Citation) => void;
  activeCitationMarker?: number | null;
  onRetry?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onCitationClick,
  activeCitationMarker,
  onRetry,
}) => {
  const [feedback, setFeedback] = useState<UserFeedback | undefined>(message.feedback);
  const [showSourcesList, setShowSourcesList] = useState<boolean>(false);

  const handleFeedback = async (type: UserFeedback) => {
    setFeedback(type);
    await updateMessageFeedback(message.id, type);
  };

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-in fade-in">
        <div className="flex items-start gap-2 max-w-xl">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm shadow-xs font-medium leading-relaxed">
            {message.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
            <User size={14} />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message rendering
  const isAbstain =
    message.status === 'no_relevant_passages' ||
    message.status === 'insufficient_evidence';
  const isError = message.status === 'error';

  return (
    <div className="flex justify-start mb-6 animate-in fade-in">
      <div className="flex items-start gap-3 max-w-2xl w-full">
        <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-1 shadow-2xs">
          <Sparkles size={14} />
        </div>

        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-5 shadow-xs">
          {/* Answer content or Abstention Banner */}
          {isAbstain ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-amber-900">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs tracking-wide uppercase text-amber-800">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>
                  {message.status === 'no_relevant_passages'
                    ? 'Low Document Relevance'
                    : 'Insufficient Evidence Grounding'}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-amber-950 font-medium">
                {message.content}
              </p>
              <p className="text-xs text-amber-700/90 mt-2">
                DocuMind refrains from fabricating answers when verifiable citations cannot be established from your selected scope.
              </p>
            </div>
          ) : isError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900">
              <div className="flex items-center gap-2 mb-1.5 font-semibold text-xs text-rose-800">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>Pipeline Notice</span>
              </div>
              <p className="text-sm text-rose-700">
                {message.errorMessage || 'An error occurred while generating this answer.'}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Retry Request</span>
                </button>
              )}
            </div>
          ) : (
            <SafeMarkdown
              content={message.content}
              onCitationClick={(marker) => {
                const found = message.citations.find((c) => c.marker === marker);
                if (found) onCitationClick(found);
              }}
              activeMarker={activeCitationMarker}
            />
          )}

          {/* Citations bar (if citations exist) */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sources & Citations ({message.citations.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowSourcesList(!showSourcesList)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  <span>{showSourcesList ? 'Collapse sources' : 'View all sources'}</span>
                  {showSourcesList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Inline Citation Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {message.citations.map((c) => {
                  const isActive = activeCitationMarker === c.marker;
                  return (
                    <button
                      key={c.marker}
                      type="button"
                      onClick={() => onCitationClick(c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                          : 'bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700'
                      }`}
                      title={`Open ${c.documentName} page ${c.pageNumber}`}
                    >
                      <span className="font-mono font-bold">[{c.marker}]</span>
                      <span className="truncate max-w-[120px] font-medium">{c.documentName}</span>
                      <span className="text-[10px] opacity-80">p.{c.pageNumber}</span>
                      {c.verified ? (
                        <ShieldCheck size={12} className={isActive ? 'text-white' : 'text-emerald-600'} />
                      ) : (
                        <AlertTriangle size={12} className={isActive ? 'text-white' : 'text-amber-500'} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Expanded Sources Drawer */}
              {showSourcesList && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {message.citations.map((cit) => (
                    <div
                      key={cit.marker}
                      onClick={() => onCitationClick(cit)}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-700">[{cit.marker}]</span>
                          <span className="font-semibold text-slate-800">{cit.documentName}</span>
                          <span className="text-slate-500">• Page {cit.pageNumber}</span>
                        </div>
                        <StatusBadge
                          status={
                            cit.sourceDeleted
                              ? 'Source Deleted'
                              : cit.verified
                              ? 'Verified'
                              : 'Unverified'
                          }
                          size="sm"
                        />
                      </div>
                      <p className="text-slate-600 italic line-clamp-2">"{cit.quote}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer: Latency metadata & Feedback buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            {/* Latency info */}
            {message.latencyMs && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <Clock size={12} />
                <span>
                  Retrieval: {message.latencyMs.retrieval}ms • Total: {message.latencyMs.total}ms
                </span>
              </div>
            )}

            {/* Feedback Buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-slate-400 mr-1">Feedback:</span>
              <button
                type="button"
                onClick={() => handleFeedback('helpful')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  feedback === 'helpful'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Helpful and accurate"
                aria-label="Helpful"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback('incorrect')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  feedback === 'incorrect'
                    ? 'bg-rose-100 text-rose-800'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Incorrect answer"
                aria-label="Incorrect answer"
              >
                <ThumbsDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback('unsupported_citation')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  feedback === 'unsupported_citation'
                    ? 'bg-amber-100 text-amber-800'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Unsupported citation quote"
              >
                Unsupported Citation
              </button>
              <button
                type="button"
                onClick={() => handleFeedback('missing_info')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  feedback === 'missing_info'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Missing key information"
              >
                Missing Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
