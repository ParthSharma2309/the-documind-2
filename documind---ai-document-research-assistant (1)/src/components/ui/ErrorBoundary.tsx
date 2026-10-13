import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-md text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              An unexpected error occurred while rendering the research interface. Your stored documents and data in IndexedDB are safe.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] font-mono text-slate-700 text-left mb-4 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reload DocuMind</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
