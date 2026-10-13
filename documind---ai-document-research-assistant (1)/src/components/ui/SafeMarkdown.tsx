import React from 'react';

interface SafeMarkdownProps {
  content: string;
  onCitationClick?: (marker: number) => void;
  activeMarker?: number | null;
}

/**
 * Renders markdown text safely without dangerouslySetInnerHTML,
 * strips unsafe HTML and remote images, and transforms [1], [2] citation markers
 * into clickable interactive citation chips.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({
  content,
  onCitationClick,
  activeMarker,
}) => {
  // Split into paragraphs / lines
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3 text-slate-800 leading-relaxed font-sans text-[15px]">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Code blocks
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const codeContent = trimmed.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
          return (
            <pre
              key={bIdx}
              className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto my-2"
            >
              <code>{codeContent}</code>
            </pre>
          );
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} className="text-base font-semibold text-slate-900 pt-2 pb-1">
              {renderInline(trimmed.slice(4), onCitationClick, activeMarker)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={bIdx} className="text-lg font-bold text-slate-900 pt-3 pb-1 border-b border-slate-100">
              {renderInline(trimmed.slice(3), onCitationClick, activeMarker)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={bIdx} className="text-xl font-bold text-slate-900 pt-4 pb-2">
              {renderInline(trimmed.slice(2), onCitationClick, activeMarker)}
            </h2>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={bIdx}
              className="border-l-4 border-indigo-400 pl-4 py-1 italic text-slate-700 bg-indigo-50/40 rounded-r"
            >
              {renderInline(trimmed.slice(2), onCitationClick, activeMarker)}
            </blockquote>
          );
        }

        // Bullet lists
        if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const items = trimmed.split('\n').filter((l) => l.trim().length > 0);
          return (
            <ul key={bIdx} className="list-disc pl-5 space-y-1.5 text-slate-800">
              {items.map((item, itemIdx) => {
                const text = item.replace(/^[-*]\s+/, '');
                return (
                  <li key={itemIdx}>
                    {renderInline(text, onCitationClick, activeMarker)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered lists
        if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
          const items = trimmed.split('\n').filter((l) => l.trim().length > 0);
          return (
            <ol key={bIdx} className="list-decimal pl-5 space-y-1.5 text-slate-800">
              {items.map((item, itemIdx) => {
                const text = item.replace(/^\d+\.\s+/, '');
                return (
                  <li key={itemIdx}>
                    {renderInline(text, onCitationClick, activeMarker)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph with inline citation chips
        return (
          <p key={bIdx} className="break-words">
            {renderInline(trimmed, onCitationClick, activeMarker)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Safely parses inline formatting: bold (**text**), code (`text`), and citation markers ([1], [2]).
 */
function renderInline(
  text: string,
  onCitationClick?: (marker: number) => void,
  activeMarker?: number | null
): React.ReactNode[] {
  // Regex matches:
  // 1. Citation markers: \[(\d+)\]
  // 2. Bold text: \*\*([^*]+)\*\*
  // 3. Inline code: `([^`]+)`
  const tokenRegex = /(\[(\d+)\])|(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Plain text before token
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // Citation marker: [n]
      const markerNum = parseInt(match[2], 10);
      const isActive = activeMarker === markerNum;
      nodes.push(
        <button
          key={`cit-${match.index}`}
          type="button"
          onClick={() => onCitationClick?.(markerNum)}
          className={`inline-flex items-center justify-center font-mono font-semibold text-xs px-1.5 py-0.5 mx-0.5 rounded transition-all duration-150 cursor-pointer ${
            isActive
              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 shadow-sm'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300'
          }`}
          title={`Jump to Citation [${markerNum}] in PDF`}
          aria-label={`Citation ${markerNum}`}
        >
          [{markerNum}]
        </button>
      );
    } else if (match[3]) {
      // Bold text
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-slate-900">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      // Inline code
      nodes.push(
        <code
          key={`code-${match.index}`}
          className="bg-slate-100 text-slate-800 text-xs px-1 py-0.5 rounded font-mono border border-slate-200"
        >
          {match[6]}
        </code>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Trailing text
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}
