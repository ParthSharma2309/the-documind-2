import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Citation } from '../../types/index.ts';
import { StatusBadge } from '../ui/Badge.tsx';

interface PDFViewerProps {
  blob?: Blob;
  documentName?: string;
  initialPage?: number;
  activeCitation?: Citation | null;
  onCloseCitation?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  blob,
  documentName = 'Document',
  initialPage = 1,
  activeCitation,
  onCloseCitation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const renderTaskRef = useRef<any>(null);

  // Jump to citation page when active citation changes
  useEffect(() => {
    if (activeCitation?.pageNumber && pdfDoc) {
      const page = Math.min(Math.max(activeCitation.pageNumber, 1), pdfDoc.numPages);
      setCurrentPage(page);
    }
  }, [activeCitation, pdfDoc]);

  // Load PDF Document when blob changes
  useEffect(() => {
    let isCancelled = false;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;

    if (!blob) {
      setPdfDoc(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setRenderError(null);

    const loadPDF = async () => {
      try {
        const buffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          useSystemFonts: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          loadedDoc = doc;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          // Prioritize active citation's page number if present, else initialPage
          const target = activeCitation?.pageNumber ?? initialPage;
          const validPage = target > 0 && target <= doc.numPages ? target : 1;
          setCurrentPage(validPage);
          setLoading(false);
        } else {
          (doc as any).destroy?.() || doc.cleanup?.();
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error loading PDF document:', err);
          setRenderError(err.message || 'Failed to render PDF document');
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isCancelled = true;
      if (loadedDoc) {
        try {
          (loadedDoc as any).destroy?.() || loadedDoc.cleanup?.();
        } catch {}
      }
    };
  }, [blob, initialPage]);

  // Render current page to canvas with cancellation
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel any pending render task to prevent canvas drawing collisions
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= totalPages) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.1);
  };

  const handleCopyQuote = () => {
    if (activeCitation?.quote) {
      navigator.clipboard.writeText(activeCitation.quote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!blob) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-l border-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
          <BookOpen size={28} />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Integrated PDF Viewer
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Click any citation marker like <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">[1]</span> in the conversation to automatically jump to the supporting page and inspect the excerpt.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100/70 border-l border-slate-200 select-none">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shadow-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={16} className="text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 truncate" title={documentName}>
            {documentName}
          </span>
        </div>

        {/* Page Nav & Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 rounded transition-colors cursor-pointer"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-700 px-2 min-w-[70px] text-center font-mono">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 rounded transition-colors cursor-pointer"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 text-[11px] font-mono text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Supporting Excerpt Card (shown when a citation is active) */}
      {activeCitation && (
        <div className="mx-3 mt-3 p-3 bg-white border border-indigo-200 rounded-xl shadow-xs shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded shadow-xs">
                [{activeCitation.marker}]
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Page {activeCitation.pageNumber}
              </span>
              <StatusBadge
                status={
                  activeCitation.sourceDeleted
                    ? 'Source Deleted'
                    : activeCitation.verified
                    ? 'Verified'
                    : 'Unverified'
                }
                size="sm"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyQuote}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
                title="Copy excerpt quote"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              {onCloseCitation && (
                <button
                  type="button"
                  onClick={onCloseCitation}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded transition-colors cursor-pointer"
                  title="Dismiss excerpt view"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-800 leading-relaxed max-h-28 overflow-y-auto bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100 italic">
            "{activeCitation.quote}"
          </div>

          {!activeCitation.verified && !activeCitation.sourceDeleted && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              <AlertTriangle size={12} className="shrink-0 text-amber-600" />
              <span>
                Note: This quote was partially paraphrased or could not be verified verbatim on this page.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-start justify-center"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-500">Rendering page {currentPage}...</span>
          </div>
        ) : renderError ? (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center max-w-md my-8">
            <AlertTriangle size={24} className="text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-rose-800 mb-1">Viewer Error</h4>
            <p className="text-xs text-rose-600">{renderError}</p>
          </div>
        ) : (
          <div className="relative shadow-md rounded-lg overflow-hidden bg-white border border-slate-200 transition-transform duration-100">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`${documentName}, page ${currentPage} of ${totalPages}`}
              className="block max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};
