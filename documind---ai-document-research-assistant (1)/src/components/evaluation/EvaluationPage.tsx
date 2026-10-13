import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  BarChart2,
  HelpCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  EvaluationItem,
  EvaluationRun,
  DocumentRecord,
  SettingsState,
} from '../../types/index.ts';
import {
  getEvaluationItems,
  saveEvaluationItem,
  deleteEvaluationItem,
  getEvaluationRuns,
  deleteEvaluationRun,
  getSettings,
} from '../../services/storage.ts';
import { runEvaluationSuite } from '../../services/evalRunner.ts';
import { Modal } from '../ui/Modal.tsx';

interface EvaluationPageProps {
  documents: DocumentRecord[];
}

export const EvaluationPage: React.FC<EvaluationPageProps> = ({ documents }) => {
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [settings, setSettings] = useState<SettingsState | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<{
    completed: number;
    total: number;
    currentQuestion: string;
  } | null>(null);

  // New item modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItemQuestion, setNewItemQuestion] = useState<string>('');
  const [newItemDocId, setNewItemDocId] = useState<string>('');
  const [newItemPages, setNewItemPages] = useState<string>('1');
  const [newItemAnswerable, setNewItemAnswerable] = useState<boolean>(true);
  const [newItemNotes, setNewItemNotes] = useState<string>('');

  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const readyDocs = documents.filter((d) => d.status === 'Ready');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await getSettings();
    setSettings(s);

    const storedItems = await getEvaluationItems();
    setItems(storedItems);

    const storedRuns = await getEvaluationRuns();
    setRuns(storedRuns);

    if (storedRuns.length > 0) {
      setExpandedRunId(storedRuns[0].id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemQuestion.trim()) return;

    const targetDoc = documents.find((d) => d.id === newItemDocId);
    const parsedPages = newItemPages
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p) && p > 0);

    const item: EvaluationItem = {
      id: `eval_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: newItemQuestion.trim(),
      expectedDocumentId: newItemDocId || '',
      expectedDocumentName: targetDoc?.name || 'Any Document',
      expectedPages: parsedPages,
      isAnswerable: newItemAnswerable,
      notes: newItemNotes.trim() || undefined,
    };

    await saveEvaluationItem(item);
    setItems((prev) => [...prev, item]);

    setNewItemQuestion('');
    setNewItemPages('1');
    setNewItemNotes('');
    setShowAddModal(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteEvaluationItem(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleLoadSampleTestCases = async () => {
    if (readyDocs.length === 0) {
      alert('Please upload and process at least one ready PDF document first.');
      return;
    }

    const doc1 = readyDocs[0];
    const doc2 = readyDocs.length > 1 ? readyDocs[1] : readyDocs[0];

    const sampleItems: EvaluationItem[] = [
      {
        id: `sample_1_${Date.now()}`,
        question: `What are the core arguments or topics discussed in ${doc1.name}?`,
        expectedDocumentId: doc1.id,
        expectedDocumentName: doc1.name,
        expectedPages: [1, 2],
        isAnswerable: true,
        notes: 'Broad topic extraction from initial pages',
      },
      {
        id: `sample_2_${Date.now()}`,
        question: `What methodology, evidence, or specific metrics are described?`,
        expectedDocumentId: doc1.id,
        expectedDocumentName: doc1.name,
        expectedPages: [1, Math.min(3, doc1.pageCount)],
        isAnswerable: true,
        notes: 'Detailed factual recall test',
      },
      {
        id: `sample_3_${Date.now()}`,
        question: 'Who won the 1994 FIFA World Cup soccer tournament?',
        expectedDocumentId: '',
        expectedDocumentName: 'Outside Scope',
        expectedPages: [],
        isAnswerable: false,
        notes: 'Negative / Abstention test: Unrelated outside fact',
      },
    ];

    if (readyDocs.length > 1) {
      sampleItems.push({
        id: `sample_4_${Date.now()}`,
        question: `Compare the main subjects between ${doc1.name} and ${doc2.name}.`,
        expectedDocumentId: doc2.id,
        expectedDocumentName: doc2.name,
        expectedPages: [1],
        isAnswerable: true,
        notes: 'Cross-document comparison test',
      });
    }

    for (const item of sampleItems) {
      await saveEvaluationItem(item);
    }
    setItems((prev) => [...prev, ...sampleItems]);
  };

  const handleRunEvaluation = async () => {
    if (items.length === 0) {
      alert('Please add at least one test case or click "Load Sample Test Cases" before running.');
      return;
    }
    if (!settings) return;

    setIsRunning(true);
    setCurrentProgress({
      completed: 0,
      total: items.length,
      currentQuestion: items[0].question,
    });

    try {
      const runResult = await runEvaluationSuite(items, settings, (completed, total, latest) => {
        setCurrentProgress({
          completed,
          total,
          currentQuestion: latest.question,
        });
      });

      setRuns((prev) => [runResult, ...prev]);
      setExpandedRunId(runResult.id);
    } catch (err: any) {
      console.error('Evaluation run error:', err);
      alert(`Evaluation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
      setCurrentProgress(null);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    await deleteEvaluationRun(runId);
    setRuns((prev) => prev.filter((r) => r.id !== runId));
  };

  const latestRun = runs[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Pipeline Evaluation & Benchmarking
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Measure Recall@3, Recall@5, citation validity, and abstention precision against your real document set.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <button
              type="button"
              onClick={handleLoadSampleTestCases}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-indigo-600" />
              <span>Load Sample Test Cases</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Test Case</span>
          </button>

          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isRunning || items.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Running Evaluation...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Run Evaluation ({items.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live running status banner */}
      {isRunning && currentProgress && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-xs animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Benchmarking in Progress: Case {currentProgress.completed + 1} of {currentProgress.total}
            </span>
            <span className="text-xs font-mono font-bold text-indigo-700">
              {Math.round(((currentProgress.completed) / currentProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentProgress.completed) / currentProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-indigo-800 truncate font-mono">
            Evaluating: "{currentProgress.currentQuestion}"
          </p>
        </div>
      )}

      {/* Metrics Cards (Shown only when real runs exist) */}
      {latestRun ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Latest Benchmark Scores
              </h2>
              <span className="text-xs text-slate-400">
                Run {new Date(latestRun.createdAt).toLocaleTimeString()} ({latestRun.itemCount} items)
              </span>
            </div>
            <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Top-K: {latestRun.config.topK} • Threshold: {latestRun.config.similarityThreshold}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {/* Recall@3 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Recall @ 3
              </span>
              <div className="text-2xl font-black text-indigo-600">
                {latestRun.metrics.recallAt3}%
              </div>
              <span className="text-[10px] text-slate-400">Target page in top 3</span>
            </div>

            {/* Recall@5 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Recall @ 5
              </span>
              <div className="text-2xl font-black text-indigo-600">
                {latestRun.metrics.recallAt5}%
              </div>
              <span className="text-[10px] text-slate-400">Target page in top 5</span>
            </div>

            {/* Citation Validity */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Citation Validity
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {latestRun.metrics.citationValidity}%
              </div>
              <span className="text-[10px] text-slate-400">Pre-validation valid markers</span>
            </div>

            {/* Abstention Precision */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Abstention Prec.
              </span>
              <div className="text-2xl font-black text-slate-800">
                {latestRun.metrics.abstentionPrecision}%
              </div>
              <span className="text-[10px] text-slate-400">Abstains were unanswerable</span>
            </div>

            {/* Abstention Recall */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Abstention Recall
              </span>
              <div className="text-2xl font-black text-slate-800">
                {latestRun.metrics.abstentionRecall}%
              </div>
              <span className="text-[10px] text-slate-400">Unanswerable cases caught</span>
            </div>

            {/* False Abstain Rate */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                False Abstain Rate
              </span>
              <div className="text-2xl font-black text-rose-600">
                {latestRun.metrics.falseAbstainRate}%
              </div>
              <span className="text-[10px] text-slate-400">Answerable wrongly rejected</span>
            </div>
          </div>

          {/* Latency Percentiles */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span className="font-bold text-slate-800">Retrieval Latency:</span>
              <span className="font-mono text-slate-600">p50: {latestRun.metrics.p50RetrievalLatencyMs}ms</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">p95: {latestRun.metrics.p95RetrievalLatencyMs}ms</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span className="font-bold text-slate-800">End-to-End Latency:</span>
              <span className="font-mono text-indigo-700 font-semibold">p50: {latestRun.metrics.p50EndToEndLatencyMs}ms</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-indigo-700 font-semibold">p95: {latestRun.metrics.p95EndToEndLatencyMs}ms</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-2xs">
          <BarChart2 size={32} className="text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No evaluation runs recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Configure test questions below and click "Run Evaluation" to calculate genuine pipeline metrics. We never fabricate benchmark figures.
          </p>
        </div>
      )}

      {/* Test Cases Table */}
      <div className="mb-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Evaluation Test Cases ({items.length})</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add test case</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No test cases in the suite. Click "Add Test Case" or "Load Sample Test Cases" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Question</th>
                  <th className="py-2.5 px-3">Target Document</th>
                  <th className="py-2.5 px-3">Expected Page(s)</th>
                  <th className="py-2.5 px-3">Answerable?</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate">
                      {item.question}
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                      {item.expectedDocumentName || 'Any'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {item.expectedPages.length > 0 ? item.expectedPages.join(', ') : 'None'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.isAnswerable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.isAnswerable ? 'Answerable' : 'Unanswerable (Abstain)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 italic truncate max-w-[140px]">
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Delete test case"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Runs Breakdown */}
      {runs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Past Run History ({runs.length})
          </h2>

          <div className="space-y-4">
            {runs.map((run) => {
              const isExpanded = expandedRunId === run.id;
              return (
                <div key={run.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                    className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({run.itemCount} test cases)
                      </span>
                      <span className="text-xs text-indigo-700 font-semibold font-mono bg-indigo-50 px-2 py-0.5 rounded">
                        R@3: {run.metrics.recallAt3}% • R@5: {run.metrics.recallAt5}% • Citation Valid: {run.metrics.citationValidity}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRun(run.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete run record"
                      >
                        <Trash2 size={13} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100/60 text-slate-500 uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="py-2 px-2">Question</th>
                            <th className="py-2 px-2">Outcome</th>
                            <th className="py-2 px-2">Recall@3</th>
                            <th className="py-2 px-2">Recall@5</th>
                            <th className="py-2 px-2">Valid Citations</th>
                            <th className="py-2 px-2">Retrieval</th>
                            <th className="py-2 px-2">Total Latency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {run.itemResults.map((res, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              <td className="py-2 px-2 font-medium text-slate-800 max-w-xs truncate" title={res.question}>
                                {res.question}
                              </td>
                              <td className="py-2 px-2">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded font-mono text-[10px] ${
                                    res.outcome === 'answered'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {res.outcome}
                                </span>
                              </td>
                              <td className="py-2 px-2">
                                {res.recallAt3 ? (
                                  <span className="text-emerald-600 font-bold">✓ Hit</span>
                                ) : (
                                  <span className="text-slate-400">Miss</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                {res.recallAt5 ? (
                                  <span className="text-emerald-600 font-bold">✓ Hit</span>
                                ) : (
                                  <span className="text-slate-400">Miss</span>
                                )}
                              </td>
                              <td className="py-2 px-2 font-mono">
                                {res.validMarkersCount} / {res.modelMarkersProduced}
                              </td>
                              <td className="py-2 px-2 font-mono text-slate-500">
                                {res.retrievalLatencyMs}ms
                              </td>
                              <td className="py-2 px-2 font-mono text-slate-700 font-semibold">
                                {res.totalLatencyMs}ms
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Test Case Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Evaluation Test Case"
        description="Define an expected question, target page, and ground truth answerability"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemQuestion.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              Save Test Case
            </button>
          </>
        }
      >
        <form onSubmit={handleAddItem} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              User Question / Prompt *
            </label>
            <input
              type="text"
              value={newItemQuestion}
              onChange={(e) => setNewItemQuestion(e.target.value)}
              placeholder="e.g. What were the third-quarter revenue results?"
              autoFocus
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Document (Optional)
            </label>
            <select
              value={newItemDocId}
              onChange={(e) => setNewItemDocId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
            >
              <option value="">Any / Not specific</option>
              {readyDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.pageCount} pages)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Target Page Numbers (comma-separated, 1-based)
            </label>
            <input
              type="text"
              value={newItemPages}
              onChange={(e) => setNewItemPages(e.target.value)}
              placeholder="e.g. 1, 3, 5"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={newItemAnswerable}
                onChange={(e) => setNewItemAnswerable(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Expected to be answerable (uncheck if this is an abstention test)
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Test Notes / Objective (Optional)
            </label>
            <input
              type="text"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              placeholder="e.g. Verifies multi-hop synthesis"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
