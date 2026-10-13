import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { processPDFFile } from '../../services/docProcessor.ts';
import { DocumentRecord } from '../../types/index.ts';

interface DropzoneProps {
  collectionId?: string;
  onUploadSuccess?: (doc: DocumentRecord) => void;
  onUploadError?: (error: string) => void;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  collectionId,
  onUploadSuccess,
  onUploadError,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFilesCount, setTotalFilesCount] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [stepText, setStepText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      const err = 'Please select valid PDF files (.pdf).';
      setUploadError(err);
      onUploadError?.(err);
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setTotalFilesCount(pdfFiles.length);

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      setCurrentFileIndex(i + 1);
      setCurrentFileName(file.name);
      setProgressPercent(10);
      setStepText('Starting ingestion...');

      try {
        const processedDoc = await processPDFFile(file, file.name, {
          collectionId,
          onProgress: (pct, msg) => {
            setProgressPercent(pct);
            setStepText(msg);
          },
        });
        onUploadSuccess?.(processedDoc);
      } catch (err: any) {
        console.error(`Failed to process ${file.name}:`, err);
        const errMessage = `${file.name}: ${err.message || 'Processing failed'}`;
        setUploadError(errMessage);
        onUploadError?.(errMessage);
      }
    }

    setIsProcessing(false);
    setProgressPercent(0);
    setCurrentFileName('');
    setStepText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer text-center select-none ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
        } ${compact ? 'p-4' : 'p-8'}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload PDF documents"
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Loader2 size={22} className="animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Processing {currentFileIndex} of {totalFilesCount}: {currentFileName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{stepText}</p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-500">{progressPercent}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs mb-1">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Drag and drop PDF files here, or <span className="text-indigo-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Multi-file upload (≤25 MB) • Original PDFs remain in your browser • Text passages embedded with Gemini
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mt-2.5 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Upload Notice: </span>
            {uploadError}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUploadError(null);
            }}
            className="text-rose-400 hover:text-rose-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
