import React, { useState } from 'react';
import {
  Layers,
  Folder,
  FileText,
  ChevronDown,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { DocumentRecord, CollectionRecord, RetrievalScope } from '../../types/index.ts';

interface ScopeSelectorProps {
  documents: DocumentRecord[];
  collections: CollectionRecord[];
  scope: RetrievalScope;
  onChangeScope: (newScope: RetrievalScope) => void;
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  documents,
  collections,
  scope,
  onChangeScope,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const readyDocs = documents.filter((d) => d.status === 'Ready');

  const getScopeLabel = () => {
    if (scope.type === 'all') {
      return `All Documents (${readyDocs.length})`;
    }
    if (scope.type === 'collection') {
      const col = collections.find((c) => c.id === scope.collectionId);
      const count = readyDocs.filter((d) => d.collectionId === scope.collectionId).length;
      return `Collection: ${col?.name || 'Unknown'} (${count})`;
    }
    if (scope.type === 'selected') {
      return `Selected Docs (${scope.documentIds.length} of ${readyDocs.length})`;
    }
    return 'Scope';
  };

  const handleToggleDoc = (docId: string) => {
    let currentSelected: string[] = [];
    if (scope.type === 'selected') {
      currentSelected = [...scope.documentIds];
    } else {
      currentSelected = readyDocs.map((d) => d.id);
    }

    if (currentSelected.includes(docId)) {
      currentSelected = currentSelected.filter((id) => id !== docId);
    } else {
      currentSelected.push(docId);
    }

    if (currentSelected.length === readyDocs.length) {
      onChangeScope({ type: 'all' });
    } else {
      onChangeScope({ type: 'selected', documentIds: currentSelected });
    }
  };

  const handleSelectAll = () => {
    onChangeScope({ type: 'all' });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1 px-1">
        <span>RESEARCH SCOPE</span>
        <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
          {scope.type === 'all'
            ? 'All'
            : scope.type === 'collection'
            ? 'Folder'
            : `${(scope as any).documentIds?.length || 0} docs`}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {scope.type === 'all' && <Layers size={14} className="text-indigo-600 shrink-0" />}
          {scope.type === 'collection' && <Folder size={14} className="text-amber-600 shrink-0" />}
          {scope.type === 'selected' && <FileText size={14} className="text-violet-600 shrink-0" />}
          <span className="truncate">{getScopeLabel()}</span>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs divide-y divide-slate-100">
          {/* Preset: All Ready Documents */}
          <div className="pb-1.5">
            <button
              type="button"
              onClick={() => {
                handleSelectAll();
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                scope.type === 'all' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-indigo-600" />
                <span>Search all ready documents</span>
              </div>
              {scope.type === 'all' && <Check size={14} className="text-indigo-600" />}
            </button>
          </div>

          {/* Collections Section */}
          {collections.length > 0 && (
            <div className="py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Collections
              </span>
              {collections.map((col) => {
                const isSelected = scope.type === 'collection' && scope.collectionId === col.id;
                const count = readyDocs.filter((d) => d.collectionId === col.id).length;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      onChangeScope({ type: 'collection', collectionId: col.id });
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-50 text-amber-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder size={14} className="text-amber-500 shrink-0" />
                      <span className="truncate">{col.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({count})</span>
                    </div>
                    {isSelected && <Check size={14} className="text-amber-600" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Individual Documents Checklist */}
          <div className="pt-1.5 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
              Select Specific Documents
            </span>
            {readyDocs.length === 0 ? (
              <p className="px-2 py-1 text-slate-400 italic">No ready documents yet</p>
            ) : (
              readyDocs.map((doc) => {
                const isChecked =
                  scope.type === 'all' ||
                  (scope.type === 'selected' && scope.documentIds.includes(doc.id)) ||
                  (scope.type === 'collection' && doc.collectionId === scope.collectionId);

                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleToggleDoc(doc.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-left text-slate-700 transition-colors cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare size={14} className="text-indigo-600 shrink-0" />
                    ) : (
                      <Square size={14} className="text-slate-300 shrink-0" />
                    )}
                    <span className="truncate text-xs">{doc.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto shrink-0">
                      p.{doc.pageCount}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
