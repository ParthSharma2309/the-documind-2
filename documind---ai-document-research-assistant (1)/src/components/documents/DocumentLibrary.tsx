import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  FolderPlus,
  Folder,
  RotateCcw,
  Calendar,
  Layers,
  Check,
  Edit2,
  AlertCircle,
  FileQuestion,
  Filter,
} from 'lucide-react';
import { DocumentRecord, CollectionRecord } from '../../types/index.ts';
import { StatusBadge } from '../ui/Badge.tsx';
import { Dropzone } from './Dropzone.tsx';
import { Modal } from '../ui/Modal.tsx';
import {
  deleteDocument,
  saveCollection,
  deleteCollection,
  updateDocumentStatus,
} from '../../services/storage.ts';
import { retryProcessDocument } from '../../services/docProcessor.ts';

interface DocumentLibraryProps {
  documents: DocumentRecord[];
  collections: CollectionRecord[];
  onRefresh: () => void;
  onOpenDocumentInWorkspace: (docId: string) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  collections,
  onRefresh,
  onOpenDocumentInWorkspace,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>('all');
  const [showUploadZone, setShowUploadZone] = useState<boolean>(true);

  // Modal states
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [showNewCollectionModal, setShowNewCollectionModal] = useState<boolean>(false);
  const [newCollectionName, setNewCollectionName] = useState<string>('');

  const [assigningDoc, setAssigningDoc] = useState<DocumentRecord | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection =
      selectedCollectionFilter === 'all' ||
      (selectedCollectionFilter === 'unassigned' && !doc.collectionId) ||
      doc.collectionId === selectedCollectionFilter;
    return matchesSearch && matchesCollection;
  });

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDocument(docToDelete.id);
      setDocToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const newCol: CollectionRecord = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newCollectionName.trim(),
      createdAt: Date.now(),
    };
    await saveCollection(newCol);
    setNewCollectionName('');
    setShowNewCollectionModal(false);
    onRefresh();
  };

  const handleDeleteCollection = async (colId: string) => {
    if (confirm('Are you sure you want to delete this collection? Documents inside will become unassigned.')) {
      await deleteCollection(colId);
      if (selectedCollectionFilter === colId) {
        setSelectedCollectionFilter('all');
      }
      onRefresh();
    }
  };

  const handleAssignCollection = async () => {
    if (!assigningDoc) return;
    await updateDocumentStatus(assigningDoc.id, {
      collectionId: selectedCollectionId || undefined,
    });
    setAssigningDoc(null);
    onRefresh();
  };

  const handleRetry = async (docId: string) => {
    setRetryingDocId(docId);
    try {
      await retryProcessDocument(docId);
      onRefresh();
    } catch (err: any) {
      alert(`Retry failed: ${err.message || 'Unknown error'}`);
    } finally {
      setRetryingDocId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Document Library
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Manage your research PDFs, organise collections, and inspect page chunk indexing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewCollectionModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <FolderPlus size={15} className="text-amber-500" />
            <span>New Collection</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{showUploadZone ? 'Hide Upload Zone' : 'Upload PDF'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      {showUploadZone && (
        <div className="mb-8">
          <Dropzone
            onUploadSuccess={() => onRefresh()}
            onUploadError={() => onRefresh()}
          />
        </div>
      )}

      {/* Collection tabs & search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Collections filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCollectionFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              selectedCollectionFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Docs ({documents.length})
          </button>

          {collections.map((col) => {
            const count = documents.filter((d) => d.collectionId === col.id).length;
            const isSelected = selectedCollectionFilter === col.id;
            return (
              <div key={col.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCollectionFilter(col.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Folder size={13} className={isSelected ? 'text-white' : 'text-amber-500'} />
                  <span>{col.name}</span>
                  <span className="opacity-80 font-mono text-[10px]">({count})</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FileText size={24} />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No documents matching "${searchQuery}".`
              : 'Upload your first PDF document to begin research.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const collection = collections.find((c) => c.id === doc.collectionId);
            const isRetrying = retryingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-200 p-5 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Status Badge & Collection */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusBadge
                      status={
                        !doc.hasExtractableText
                          ? 'No Text'
                          : doc.status
                      }
                      size="sm"
                      customText={
                        doc.status === 'Processing' && doc.progress
                          ? `Processing ${doc.progress}%`
                          : undefined
                      }
                    />

                    {collection && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 truncate max-w-[140px]">
                        <Folder size={11} className="text-amber-500 shrink-0" />
                        <span className="truncate">{collection.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-bold text-slate-900 line-clamp-2 mb-2"
                    title={doc.name}
                  >
                    {doc.name}
                  </h3>

                  {/* Meta stats */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-4 font-mono">
                    <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{formatSize(doc.size)}</span>
                    <span>•</span>
                    <span className="font-sans">{formatDate(doc.uploadedAt)}</span>
                  </div>

                  {/* Extraction / Error message info */}
                  {doc.status === 'Failed' && doc.statusMessage && (
                    <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
                      <p className="font-semibold mb-0.5">Extraction Issue:</p>
                      <p>{doc.statusMessage}</p>
                    </div>
                  )}

                  {doc.status === 'Processing' && (
                    <div className="mb-4">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                          style={{ width: `${doc.progress || 10}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        {doc.statusMessage || 'Processing...'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {doc.status === 'Ready' && (
                      <button
                        type="button"
                        onClick={() => onOpenDocumentInWorkspace(doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        <span>Research</span>
                      </button>
                    )}

                    {doc.status === 'Failed' && (
                      <button
                        type="button"
                        onClick={() => handleRetry(doc.id)}
                        disabled={isRetrying}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw size={13} className={isRetrying ? 'animate-spin' : ''} />
                        <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAssigningDoc(doc);
                        setSelectedCollectionId(doc.collectionId || '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Assign collection"
                    >
                      <Folder size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        title="Delete Document"
        description="Permanently remove this document and its IndexedDB embeddings"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDocToDelete(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Document'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900">{docToDelete?.name}</strong>?
        </p>
        <p className="text-xs text-slate-500 mt-2">
          This will purge the stored PDF blob, text chunks, and embedding vectors from IndexedDB. Existing conversation citations that cite this document will be retained and flagged as <span className="font-semibold text-slate-600">"Source Deleted"</span>.
        </p>
      </Modal>

      {/* New Collection Modal */}
      <Modal
        isOpen={showNewCollectionModal}
        onClose={() => setShowNewCollectionModal(false)}
        title="Create Collection"
        description="Organize documents into thematic groups"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewCollectionModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              Create Collection
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCollection}>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Collection Name
          </label>
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="e.g. Legal Contracts, Medical Papers, Financial Reports..."
            autoFocus
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          />
        </form>
      </Modal>

      {/* Assign Collection Modal */}
      <Modal
        isOpen={!!assigningDoc}
        onClose={() => setAssigningDoc(null)}
        title="Assign Collection"
        description={`Set collection for ${assigningDoc?.name}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setAssigningDoc(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignCollection}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Save Assignment
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
            <input
              type="radio"
              name="collection_choice"
              checked={selectedCollectionId === ''}
              onChange={() => setSelectedCollectionId('')}
              className="text-indigo-600"
            />
            <span className="font-medium text-slate-700">None (Unassigned)</span>
          </label>

          {collections.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
            >
              <input
                type="radio"
                name="collection_choice"
                checked={selectedCollectionId === col.id}
                onChange={() => setSelectedCollectionId(col.id)}
                className="text-indigo-600"
              />
              <Folder size={14} className="text-amber-500" />
              <span className="font-medium text-slate-800">{col.name}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};
