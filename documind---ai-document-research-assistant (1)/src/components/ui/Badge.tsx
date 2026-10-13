import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  Trash2,
} from 'lucide-react';
import { DocumentStatus } from '../../types/index.ts';

interface StatusBadgeProps {
  status: DocumentStatus | 'Verified' | 'Unverified' | 'Source Deleted' | 'No Text';
  size?: 'sm' | 'md';
  customText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  customText,
}) => {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-xs font-medium px-2.5 py-1 gap-1.5';
  const iconSize = isSmall ? 12 : 14;

  switch (status) {
    case 'Ready':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{customText || 'Ready'}</span>
        </span>
      );

    case 'Processing':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}
        >
          <Loader2 size={iconSize} className="animate-spin text-amber-600 shrink-0" aria-hidden="true" />
          <span>{customText || 'Processing'}</span>
        </span>
      );

    case 'Failed':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}
        >
          <AlertCircle size={iconSize} className="text-rose-600 shrink-0" aria-hidden="true" />
          <span>{customText || 'Failed'}</span>
        </span>
      );

    case 'Uploaded':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <Clock size={iconSize} className="text-slate-500 shrink-0" aria-hidden="true" />
          <span>{customText || 'Uploaded'}</span>
        </span>
      );

    case 'Verified':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium ${sizeClasses}`}
          title="Direct quote verified against source document text"
        >
          <ShieldCheck size={iconSize} className="text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{customText || 'Verified Quote'}</span>
        </span>
      );

    case 'Unverified':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-medium ${sizeClasses}`}
          title="Quote could not be verbatim matched in passage text"
        >
          <AlertTriangle size={iconSize} className="text-amber-600 shrink-0" aria-hidden="true" />
          <span>{customText || 'Unverified Quote'}</span>
        </span>
      );

    case 'Source Deleted':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 line-through ${sizeClasses}`}
          title="Original source document has been removed"
        >
          <Trash2 size={iconSize} className="text-slate-500 shrink-0" aria-hidden="true" />
          <span>{customText || 'Source Deleted'}</span>
        </span>
      );

    case 'No Text':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <FileQuestion size={iconSize} className="text-rose-600 shrink-0" aria-hidden="true" />
          <span>{customText || 'No extractable text (OCR not supported)'}</span>
        </span>
      );

    default:
      return null;
  }
};
