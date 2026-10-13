import React from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Lock,
  Cpu,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onStartResearching: () => void;
  onExploreFeatures: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartResearching,
  onExploreFeatures,
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800">
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 md:px-8 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles size={14} className="text-indigo-600" />
          <span>Grounded AI Document Assistant • Browser-Only Storage</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
          Research your documents. <br />
          <span className="text-indigo-600">Verify every answer.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
          Upload PDFs, ask complex research questions, and get evidence-grounded answers with interactive page-level citations. When evidence is lacking, DocuMind abstains instead of hallucinating.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
          <button
            type="button"
            onClick={onStartResearching}
            className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
          >
            <span>Start Researching</span>
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onExploreFeatures}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 px-6 py-3.5 rounded-xl text-sm font-semibold border border-slate-300 shadow-2xs transition-all duration-150 cursor-pointer"
          >
            <span>Explore Features</span>
          </button>
        </div>

        {/* Workspace Interactive Preview Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-left max-w-4xl mx-auto">
          {/* Mock Window Top Bar */}
          <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono font-medium text-slate-500">
                DocuMind Research Workspace Preview
              </span>
            </div>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Grounded & Verified
            </span>
          </div>

          {/* Mock Workspace Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left: Chat Answer */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  U
                </div>
                <div className="bg-slate-100 text-slate-800 text-xs px-3.5 py-2 rounded-xl font-medium">
                  What was the net revenue growth reported in the financial report?
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                  <Sparkles size={13} />
                </div>
                <div className="text-xs text-slate-800 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                  <p>
                    Net consolidated revenue reached <strong className="text-slate-900">$4.82 billion</strong>, representing a 14.3% year-over-year expansion{' '}
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                      [1]
                    </span>
                    . Growth was primarily fueled by enterprise cloud subscription renewals and international operations{' '}
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                      [2]
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Right: PDF Excerpt Jump Preview */}
            <div className="p-6 bg-slate-50/60 flex flex-col justify-center space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600" />
                <span>Supporting PDF Excerpt (Page 14)</span>
              </div>
              <div className="p-3.5 bg-white border border-indigo-200 rounded-xl shadow-xs text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Citation [1]
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Verified Quote</span>
                  </span>
                </div>
                <p className="text-slate-700 italic border-l-2 border-indigo-400 pl-2 py-0.5">
                  "...total consolidated revenue expanded to $4,821 million, an increase of 14.3% compared to the prior fiscal year..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for rigorous evidence-based research
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2">
            No hallucinations. No loose claims. Every assertion is tied directly to a verifiable passage in your original documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Verifiable Page-Level Citations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every factual sentence in the response includes a citation marker [1]..[k]. Clicking any marker opens the original PDF to that exact page and highlights the verbatim excerpt.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4 shadow-2xs">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Strict Abstention Discipline
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If the documents do not contain sufficient evidence, or if the top cosine similarity falls below the relevance threshold (0.45), DocuMind clearly abstains rather than inventing an answer.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-2xs">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Browser-First Persistence
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PDF parsing and storage happen directly in your browser using IndexedDB. Documents, chunks, embeddings, and chat histories persist seamlessly across browser reloads.
            </p>
          </div>
        </div>
      </section>

      {/* HOW CITATIONS WORK SECTION */}
      <section className="py-14 px-4 md:px-8 max-w-4xl mx-auto border-t border-slate-200">
        <div className="bg-indigo-900 text-white rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider block mb-2">
              The DocuMind Citation Protocol
            </span>
            <h2 className="text-2xl font-bold mb-4">
              How our 8-step verification pipeline ensures truth
            </h2>
            <div className="space-y-3 text-xs text-indigo-100/90 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  <strong>Page Extraction & Chunking:</strong> PDF.js extracts text page-by-page. Text chunks are split strictly within individual pages (~800 characters) to ensure 100% page accuracy.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  <strong>Cosine Vector Retrieval:</strong> User queries are converted into high-dimensional embeddings and matched against chunks in IndexedDB.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  <strong>Code-Level Quote Validation:</strong> Every citation returned by the model is validated in code against the source passage text. If a quote is paraphrased rather than exact, it is flagged as Unverified.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-indigo-800/80">
              <button
                type="button"
                onClick={onStartResearching}
                className="inline-flex items-center gap-2 bg-white text-indigo-950 hover:bg-indigo-50 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Upload a PDF and Try It Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 md:px-8 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <BookOpen size={16} className="text-indigo-600" />
            <span>DocuMind</span>
            <span className="text-slate-400 font-normal">• Document Research Assistant</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Powered by Gemini API • Browser IndexedDB Storage • Zero Mock Data
          </div>
        </div>
      </footer>
    </div>
  );
};
