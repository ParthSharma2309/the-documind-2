import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  ConversationRecord,
  DocumentRecord,
  CollectionRecord,
  MessageRecord,
  Citation,
  RetrievalScope,
  SettingsState,
} from '../../types/index.ts';
import { ScopeSelector } from './ScopeSelector.tsx';
import { MessageItem } from './MessageItem.tsx';
import { PDFViewer } from '../pdf/PDFViewer.tsx';
import {
  getAllConversations,
  getMessagesByConversation,
  saveConversation,
  saveMessage,
  deleteConversation,
  getDocumentBlob,
  getSettings,
  getDocumentById,
} from '../../services/storage.ts';
import { runAnsweringPipeline } from '../../services/answering.ts';

interface WorkspaceProps {
  documents: DocumentRecord[];
  collections: CollectionRecord[];
  initialDocumentId?: string;
  initialCitation?: Citation | null;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  documents,
  collections,
  initialDocumentId,
  initialCitation,
}) => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [settings, setSettings] = useState<SettingsState | null>(null);

  // Active PDF Viewer state
  const [activePdfDocId, setActivePdfDocId] = useState<string | null>(initialDocumentId || null);
  const [activePdfBlob, setActivePdfBlob] = useState<Blob | undefined>(undefined);
  const [activePdfName, setActivePdfName] = useState<string>('Document');
  const [activeCitation, setActiveCitation] = useState<Citation | null>(initialCitation || null);

  // Mobile layout tab state: 'sidebar' | 'chat' | 'viewer'
  const [mobileTab, setMobileTab] = useState<'sidebar' | 'chat' | 'viewer'>('chat');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load initial settings and conversations
  useEffect(() => {
    const loadInitialData = async () => {
      const s = await getSettings();
      setSettings(s);

      const convs = await getAllConversations();
      setConversations(convs);

      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      } else {
        // Create first conversation
        await createNewConversation();
      }
    };
    loadInitialData();
  }, []);

  // When initialDocumentId or initialCitation changes
  useEffect(() => {
    if (initialDocumentId) {
      loadDocumentToViewer(initialDocumentId);
    }
    if (initialCitation) {
      setActiveCitation(initialCitation);
      loadDocumentToViewer(initialCitation.documentId);
    }
  }, [initialDocumentId, initialCitation]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    const loadMsgs = async () => {
      const msgs = await getMessagesByConversation(activeConvId);
      setMessages(msgs);
    };
    loadMsgs();
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const loadDocumentToViewer = async (docId: string) => {
    // If the same document is already loaded in viewer, do not re-fetch blob or re-parse
    if (docId === activePdfDocId && activePdfBlob) {
      return;
    }
    try {
      const [blob, doc] = await Promise.all([
        getDocumentBlob(docId),
        getDocumentById(docId),
      ]);
      if (blob && doc) {
        setActivePdfDocId(docId);
        setActivePdfBlob(blob);
        setActivePdfName(doc.name);
      }
    } catch (err) {
      console.error('Error loading PDF blob to viewer:', err);
    }
  };

  const createNewConversation = async () => {
    const newConv: ConversationRecord = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Research Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      scope: { type: 'all' },
    };
    await saveConversation(newConv);
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setMessages([]);
    setMobileTab('chat');
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(convId);
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    if (activeConvId === convId) {
      if (updated.length > 0) {
        setActiveConvId(updated[0].id);
      } else {
        createNewConversation();
      }
    }
  };

  const handleScopeChange = async (newScope: RetrievalScope) => {
    if (!activeConvId) return;
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;

    const updatedConv: ConversationRecord = {
      ...currentConv,
      scope: newScope,
      updatedAt: Date.now(),
    };
    await saveConversation(updatedConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? updatedConv : c))
    );
  };

  const handleCitationClick = async (citation: Citation, opts = { switchTab: true }) => {
    setActiveCitation(citation);
    await loadDocumentToViewer(citation.documentId);
    if (opts.switchTab) {
      setMobileTab('viewer');
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const currentScope = activeConv?.scope || { type: 'all' };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isSubmitting || !activeConvId || !settings) return;

    const question = inputQuery.trim();
    setInputQuery('');
    setIsSubmitting(true);

    // Auto-update conversation title if first user query
    if (messages.length === 0 && activeConv) {
      const summaryTitle = question.slice(0, 38) + (question.length > 38 ? '...' : '');
      const updated = { ...activeConv, title: summaryTitle, updatedAt: Date.now() };
      saveConversation(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? updated : c))
      );
    }

    // 1. Add user message
    const userMsg: MessageRecord = {
      id: `msg_user_${Date.now()}`,
      conversationId: activeConvId,
      role: 'user',
      content: question,
      createdAt: Date.now(),
      status: 'answered',
      citations: [],
      retrievalScope: currentScope,
    };
    await saveMessage(userMsg);
    setMessages((prev) => [...prev, userMsg]);

    // Format recent history for query rewriting
    const history = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2. Run answering pipeline
    try {
      const result = await runAnsweringPipeline({
        conversationId: activeConvId,
        userQuestion: question,
        history,
        scope: currentScope,
        settings,
      });

      const assistantMsg: MessageRecord = {
        id: `msg_asst_${Date.now()}`,
        conversationId: activeConvId,
        role: 'assistant',
        content: result.answerText,
        createdAt: Date.now(),
        status: result.status,
        errorMessage: result.errorMessage,
        citations: result.citations,
        retrievalScope: currentScope,
        retrievalScores: result.retrievalScores,
        latencyMs: result.latencyMs,
      };

      await saveMessage(assistantMsg);
      setMessages((prev) => [...prev, assistantMsg]);

      // If citations returned, auto-focus first citation in viewer without forcing mobile tab switch
      if (result.citations.length > 0) {
        handleCitationClick(result.citations[0], { switchTab: false });
      }
    } catch (err: any) {
      console.error('Submission pipeline error:', err);
      const errorMsg: MessageRecord = {
        id: `msg_err_${Date.now()}`,
        conversationId: activeConvId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        status: 'error',
        errorMessage: err.message || 'Failed to complete question answering pipeline.',
        citations: [],
        retrievalScope: currentScope,
      };
      await saveMessage(errorMsg);
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const samplePrompts = [
    'What are the main findings and conclusions?',
    'Summarize the core arguments across these documents.',
    'Compare the methodologies or approaches used.',
    'What evidence or data is presented to support the claims?',
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-61px)] overflow-hidden bg-slate-50">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('sidebar')}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 cursor-pointer ${
            mobileTab === 'sidebar'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          Sessions & Scope
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 cursor-pointer ${
            mobileTab === 'chat'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          Research Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('viewer')}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 cursor-pointer ${
            mobileTab === 'viewer'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          PDF Viewer {activeCitation ? `[${activeCitation.marker}]` : ''}
        </button>
      </div>

      {/* LEFT PANEL: Conversations & Scope */}
      <div
        className={`${
          mobileTab === 'sidebar' ? 'flex' : 'hidden'
        } md:flex w-full md:w-72 lg:w-80 flex-col bg-white border-r border-slate-200 shrink-0 h-full overflow-hidden`}
      >
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={createNewConversation}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>New Research Chat</span>
          </button>
        </div>

        {/* Scope Selector */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60">
          <ScopeSelector
            documents={documents}
            collections={collections}
            scope={currentScope}
            onChangeScope={handleScopeChange}
          />
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Conversations ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 italic text-center">
              No conversations yet. Start one!
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileTab('chat');
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-950 font-semibold border border-indigo-200/80'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-1">
                    <MessageSquare
                      size={14}
                      className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER PANEL: Research Chat */}
      <div
        className={`${
          mobileTab === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full overflow-hidden bg-slate-50/60`}
      >
        {/* Workspace Chat Header */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {activeConv?.title || 'Research Session'}
            </h2>
            <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
              {currentScope.type === 'all'
                ? 'All Ready Docs'
                : currentScope.type === 'collection'
                ? 'Collection Scope'
                : 'Custom Selection'}
            </span>
          </div>

          <div className="text-xs text-slate-400">
            {documents.filter((d) => d.status === 'Ready').length} active sources
          </div>
        </div>

        {/* Message scroll container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto my-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
                <Sparkles size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Ask anything about your documents
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-md mx-auto">
                Every claim will be backed by verifiable page-level citations. If the documents don't have sufficient evidence, DocuMind will abstain clearly.
              </p>

              {/* Sample Prompts */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Suggested queries
                </span>
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputQuery(prompt);
                    }}
                    className="w-full text-left px-3.5 py-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs text-slate-700 transition-colors shadow-2xs flex items-center justify-between group cursor-pointer"
                  >
                    <span>{prompt}</span>
                    <ChevronRight
                      size={14}
                      className="text-slate-400 group-hover:text-indigo-600 transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-2">
              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onCitationClick={handleCitationClick}
                  activeCitationMarker={activeCitation?.marker}
                  onRetry={() => {
                    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUser) {
                      setInputQuery(lastUser.content);
                    }
                  }}
                />
              ))}

              {isSubmitting && (
                <div className="flex justify-start mb-6 animate-in fade-in">
                  <div className="flex items-start gap-3 max-w-md bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <Loader2 size={18} className="animate-spin text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Retrieving passages & verifying evidence...
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Searching stored vector embeddings with cosine similarity
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question about your documents (e.g. 'What are the main arguments?')..."
              disabled={isSubmitting}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all duration-150 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isSubmitting}
              className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Send query"
              aria-label="Send query"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Answers are strictly grounded in retrieved document passages. Verifiable citations [1] link directly to PDF pages.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: PDF Viewer & Supporting Excerpt */}
      <div
        className={`${
          mobileTab === 'viewer' ? 'flex' : 'hidden'
        } md:flex w-full md:w-[420px] lg:w-[480px] xl:w-[540px] flex-col h-full shrink-0 border-l border-slate-200 bg-white`}
      >
        <PDFViewer
          blob={activePdfBlob}
          documentName={activePdfName}
          activeCitation={activeCitation}
          onCloseCitation={() => setActiveCitation(null)}
        />
      </div>
    </div>
  );
};
