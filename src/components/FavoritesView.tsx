import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Trash2, 
  Copy, 
  Check, 
  Globe, 
  Wifi, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  CheckSquare, 
  Square, 
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { QrRecord } from '../core/types.ts';
import { formatDate, exportRecordsToJson, exportRecordsToCsv, filterRecords } from '../core/qrUtils.ts';

interface FavoritesViewProps {
  records: QrRecord[];
  onBack: () => void;
  onSelectRecord: (record: QrRecord) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onClearAll: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  records,
  onBack,
  onSelectRecord,
  onToggleFavorite,
  onDeleteRecord,
  onDeleteMultiple,
  onClearAll,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'scanned' | 'generated'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Export dialog state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Pure logic filter by search query (content or title as user types) and tab
  const filteredRecords = filterRecords(records, searchQuery, filterTab);

  const handleCopy = (r: QrRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(r.content);
    setCopiedId(r.id);
    onShowToast('Details Copied', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle selection for a single record
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  // Batch delete selected records
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (window.confirm(`Delete ${count} selected record${count > 1 ? 's' : ''}?`)) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      onShowToast(`Deleted ${count} record${count > 1 ? 's' : ''}`, 'success');
    }
  };

  // Export handlers
  const handleExport = (format: 'json' | 'csv') => {
    if (records.length === 0) {
      onShowToast('No scan history to export', 'info');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      const data = exportRecordsToJson(records);
      blob = new Blob([data], { type: 'application/json' });
      filename = `ScanQR_History_${timestamp}.json`;
    } else {
      const data = exportRecordsToCsv(records);
      blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      filename = `ScanQR_History_${timestamp}.csv`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    onShowToast(`Exported history as ${format.toUpperCase()}`, 'success');
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'url':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'wifi':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-violet-400" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100 overflow-hidden relative">
      {/* Top Header */}
      <header className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={isSelectionMode ? () => setIsSelectionMode(false) : onBack}
            aria-label={isSelectionMode ? 'Cancel selection' : 'Back to generator'}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            {isSelectionMode ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {isSelectionMode ? `${selectedIds.size} Selected` : 'History & Favs'}
            </h2>
            <p className="text-xs text-neutral-400">
              {isSelectionMode ? 'Tap items to select' : `${records.length} items saved`}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {records.length > 0 && !isSelectionMode && (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                aria-label="Enter multi-select mode"
                className="px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                Select
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                aria-label="Export history to file"
                title="Export History"
                className="p-2 text-neutral-400 hover:text-emerald-400 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          {isSelectionMode && (
            <button
              onClick={handleSelectAll}
              aria-label={selectedIds.size === filteredRecords.length ? 'Deselect all' : 'Select all'}
              className="px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              {selectedIds.size === filteredRecords.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {!isSelectionMode && records.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Delete all records? This cannot be undone.')) {
                  onClearAll();
                  onShowToast('All records cleared', 'info');
                }
              }}
              aria-label="Clear all records"
              title="Clear All"
              className="p-2 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Search & Filter Bar at top of History & Favs */}
      <div className="p-4 space-y-2.5 bg-neutral-950/80 border-b border-neutral-800/80">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records by content or title..."
            aria-label="Search records by content or title"
            className="w-full pl-10 pr-9 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-emerald-500 rounded-xl text-xs text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills and Search Match Count */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            {(['all', 'favorites', 'scanned', 'generated'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                aria-label={`Filter by ${tab}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition shrink-0 cursor-pointer ${
                  filterTab === tab
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab === 'all' ? 'All Codes' : tab}
              </button>
            ))}
          </div>

          {searchQuery && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 font-medium">
              {filteredRecords.length} found
            </span>
          )}
        </div>
      </div>

      {/* Record List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-20">
        {filteredRecords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-500">
              <Search className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">
              {searchQuery ? `No records matching "${searchQuery}"` : 'No records found'}
            </p>
            <p className="text-xs text-neutral-500 max-w-xs">
              {searchQuery ? 'Try another keyword or clear the search query to see all items.' : 'Scan or generate QR codes to build your history.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium border border-neutral-700 transition cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredRecords.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  if (isSelectionMode) {
                    handleToggleSelect(item.id, e);
                  } else {
                    onSelectRecord(item);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Record ${item.content}`}
                aria-selected={isSelected}
                className={`p-3.5 border rounded-2xl transition flex items-start justify-between gap-3 cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm shadow-emerald-950/20'
                    : 'bg-neutral-950/80 hover:bg-neutral-950 border-neutral-800/80 hover:border-neutral-700/80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Selection Checkbox */}
                  {isSelectionMode ? (
                    <button
                      onClick={(e) => handleToggleSelect(item.id, e)}
                      aria-label={isSelected ? `Deselect ${item.content}` : `Select ${item.content}`}
                      className="mt-1 text-emerald-400 hover:text-emerald-300 transition shrink-0 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 fill-emerald-500 text-neutral-950" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-600" />
                      )}
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getRecordIcon(item.type)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-medium">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-200 truncate select-all">
                      {item.content}
                    </p>
                  </div>
                </div>

                {/* Action Buttons (Hidden when multi-selecting) */}
                {!isSelectionMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      aria-label={item.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        item.isFavorite
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleCopy(item, e)}
                      aria-label="Copy code content"
                      className="p-1.5 text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                      title="Copy"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(item.id);
                      }}
                      aria-label="Delete code record"
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Batch Action Bar (Active during multi-select mode) */}
      {isSelectionMode && (
        <div className="absolute bottom-4 inset-x-4 bg-neutral-900 border border-neutral-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between z-30 animate-in slide-in-from-bottom duration-200">
          <div className="text-xs text-neutral-300 font-medium pl-1">
            <span className="font-bold text-white">{selectedIds.size}</span> selected
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSelectionMode(false)}
              aria-label="Cancel multi-select mode"
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              aria-label="Delete selected records"
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-950/40 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Export Format Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            role="dialog"
            aria-labelledby="export-modal-title"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100"
          >
            <div className="bg-neutral-800/80 px-5 py-4 border-b border-neutral-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="export-modal-title" className="font-semibold text-base text-neutral-100">
                    Export Scan History
                  </h3>
                  <p className="text-[11px] text-neutral-400">{records.length} records ready</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Close export dialog"
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Choose a file format to save your entire scan and generator history to local storage:
              </p>

              {/* JSON Option */}
              <button
                onClick={() => handleExport('json')}
                aria-label="Export history as JSON file"
                className="w-full p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/50 rounded-2xl flex items-center gap-3.5 text-left transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">JSON File (.json)</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Complete structured backup with metadata and timestamps</p>
                </div>
                <Download className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition" />
              </button>

              {/* CSV Option */}
              <button
                onClick={() => handleExport('csv')}
                aria-label="Export history as CSV file"
                className="w-full p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/50 rounded-2xl flex items-center gap-3.5 text-left transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">CSV Spreadsheet (.csv)</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Excel & Sheets ready with formatted date columns</p>
                </div>
                <Download className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition" />
              </button>
            </div>

            <div className="px-5 py-3.5 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-end">
              <button
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Cancel export"
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
