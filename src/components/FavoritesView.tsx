import React, { useState, useRef } from 'react';
import {
  Search,
  Star,
  Trash2,
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
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { QrRecord, ThemeMode } from '../core/types.ts';
import {
  formatDate,
  exportRecordsToJson,
  exportRecordsToCsv,
  filterRecords,
} from '../core/qrUtils.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface FavoritesViewProps {
  theme: ThemeMode;
  records: QrRecord[];
  isLoading?: boolean;
  loadError?: string | null;
  onRefresh: () => void;
  onCreateQr: () => void;
  onSelectRecord: (record: QrRecord) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onClearAll: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  theme,
  records,
  isLoading = false,
  loadError = null,
  onRefresh,
  onCreateQr,
  onSelectRecord,
  onToggleFavorite,
  onDeleteMultiple,
  onClearAll,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'scanned' | 'generated'>('all');

  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExportSheetOpen, setIsExportSheetOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState<number>(0);
  const pullStartYRef = useRef<number | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  const isLight = theme === 'light';
  const filteredRecords = filterRecords(records, searchQuery, filterTab);

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleSelectAll = () => {
    triggerHaptic('light');
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const confirmDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    triggerHaptic('medium');
    onDeleteMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setIsDeleteConfirmOpen(false);
    onShowToast(`Deleted ${count} record${count > 1 ? 's' : ''}`, 'success');
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (records.length === 0) {
      onShowToast('No records to export', 'info');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const data = format === 'json' ? exportRecordsToJson(records) : exportRecordsToCsv(records);
    const mime = format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
    const filename = `ScanQR_History_${timestamp}.${format}`;

    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerHaptic('success');
    setIsExportSheetOpen(false);
    onShowToast(`Exported ${format.toUpperCase()} file`, 'success');
  };

  // Pull-to-refresh pointer handlers
  const handlePullStart = (e: React.PointerEvent) => {
    if (listScrollRef.current && listScrollRef.current.scrollTop === 0) {
      pullStartYRef.current = e.clientY;
    }
  };

  const handlePullMove = (e: React.PointerEvent) => {
    if (pullStartYRef.current === null) return;
    if (listScrollRef.current && listScrollRef.current.scrollTop > 0) {
      pullStartYRef.current = null;
      setPullDistance(0);
      return;
    }
    const delta = Math.max(0, Math.min(80, e.clientY - pullStartYRef.current));
    if (delta > 0) {
      setPullDistance(delta);
    }
  };

  const handlePullEnd = () => {
    if (pullStartYRef.current !== null && pullDistance >= 52) {
      triggerHaptic('medium');
      onRefresh();
    }
    pullStartYRef.current = null;
    setPullDistance(0);
  };

  const getRecordIcon = (type: string) => {
    const cls = `w-4 h-4 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`;
    switch (type) {
      case 'url':
        return <Globe className={cls} />;
      case 'wifi':
        return <Wifi className={cls} />;
      case 'email':
        return <Mail className={cls} />;
      case 'phone':
        return <Phone className={cls} />;
      default:
        return <FileText className={cls} />;
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 relative ${
        isLight ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Top Bar: strictly screen title + compact actions */}
      <header
        className={`px-4 py-2 border-b shrink-0 flex items-center justify-between gap-2 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">
            {isSelectionMode ? `${selectedIds.size} Selected` : 'History & Favs'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isSelectionMode && (
            <>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onRefresh();
                }}
                aria-label="Refresh history"
                title="Refresh"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                  isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {records.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsSelectionMode(true);
                    }}
                    aria-label="Enter multi-select mode"
                    className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isLight
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-emerald-400 hover:bg-zinc-800'
                    }`}
                  >
                    Select
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsExportSheetOpen(true);
                    }}
                    aria-label="Export history to file"
                    title="Export History"
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                      isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsClearConfirmOpen(true);
                    }}
                    aria-label="Clear all records"
                    title="Clear All"
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                      isLight ? 'text-zinc-600 hover:text-red-600 hover:bg-zinc-100' : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}

          {isSelectionMode && (
            <>
              <button
                type="button"
                onClick={handleSelectAll}
                aria-label={selectedIds.size === filteredRecords.length ? 'Deselect all' : 'Select all'}
                className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {selectedIds.size === filteredRecords.length && filteredRecords.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                aria-label="Cancel selection"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                  isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Search Bar & Filter Tabs (>= 16px input, >= 44px filter buttons, 8pt spacing) */}
      <div
        className={`p-4 space-y-3 border-b shrink-0 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        <div className="relative flex items-center">
          <Search
            className={`absolute left-3.5 w-4 h-4 pointer-events-none ${
              isLight ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          />
          <input
            type="text"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content or title..."
            aria-label="Search records by content or title"
            className={`w-full min-h-[48px] pl-10 pr-12 rounded-xl border text-base focus:outline-none focus:ring-2 transition ${
              isLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-500 focus:border-emerald-600 focus:ring-emerald-600/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSearchQuery('');
              }}
              aria-label="Clear search query"
              className={`absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer ${
                isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {(['all', 'favorites', 'scanned', 'generated'] as const).map((tab) => {
              const active = filterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFilterTab(tab);
                  }}
                  aria-label={`Filter by ${tab}`}
                  className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap border transition shrink-0 cursor-pointer ${
                    active
                      ? isLight
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-emerald-500 border-emerald-500 text-zinc-950'
                      : isLight
                      ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              );
            })}
          </div>

          <span className={`text-xs tabular-nums shrink-0 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {filteredRecords.length}
          </span>
        </div>
      </div>

      {/* Record List Container with Pull-to-Refresh + 4 States */}
      <div
        ref={listScrollRef}
        onPointerDown={handlePullStart}
        onPointerMove={handlePullMove}
        onPointerUp={handlePullEnd}
        onPointerCancel={handlePullEnd}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {pullDistance > 16 && (
          <div className="text-center py-2 text-xs text-emerald-500 font-medium">
            {pullDistance >= 52 ? 'Release to refresh' : 'Pull down to refresh'}
          </div>
        )}

        {isLoading ? (
          /* Loading State: Layout-matched skeleton */
          <div data-testid="history-loading-skeleton" className="space-y-2">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className={`h-[72px] rounded-xl border p-4 flex items-center justify-between gap-3 animate-pulse ${
                  isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />
                  <div className="space-y-2 flex-1">
                    <div className={`h-3 w-24 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />
                    <div className={`h-3.5 w-48 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />
              </div>
            ))}
          </div>
        ) : loadError ? (
          /* Error State: Human-readable reason + retry action */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Unable to Load History</p>
              <p className={`text-xs max-w-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {loadError}
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className={`min-h-[48px] px-5 rounded-xl text-sm font-semibold border cursor-pointer ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-900'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-100'
              }`}
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          /* Empty State: Clear explanation + single CTA */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {searchQuery ? `No matches for "${searchQuery}"` : 'No saved QR codes'}
              </p>
              <p className={`text-xs max-w-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {searchQuery
                  ? 'No records match that text or title.'
                  : 'Generated and scanned QR codes appear here.'}
              </p>
            </div>

            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSearchQuery('');
                }}
                aria-label="Clear search query"
                className={`min-h-[48px] px-5 rounded-xl text-sm font-semibold border cursor-pointer ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-50'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onCreateQr();
                }}
                aria-label="Create QR Code"
                className={`min-h-[48px] px-5 rounded-xl text-sm font-semibold cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                }`}
              >
                Create QR Code
              </button>
            )}
          </div>
        ) : (
          /* Populated State */
          filteredRecords.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  if (isSelectionMode) {
                    handleToggleSelect(item.id, e);
                  } else {
                    triggerHaptic('light');
                    onSelectRecord(item);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isSelectionMode) {
                      handleToggleSelect(item.id);
                    } else {
                      onSelectRecord(item);
                    }
                  }
                }}
                aria-label={`Record ${item.title || item.content}`}
                aria-selected={isSelected}
                className={`min-h-[72px] px-3 py-2.5 border rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-600'
                      : 'bg-zinc-900 border-emerald-500'
                    : isLight
                    ? 'bg-white border-zinc-200 hover:bg-zinc-50'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isSelectionMode ? (
                    <span className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className={`w-5 h-5 ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`} />
                      )}
                    </span>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      {getRecordIcon(item.type)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium capitalize ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {item.category}
                      </span>
                      <span className={`tabular-nums ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.title && (
                      <p className="text-sm font-medium truncate">{item.title}</p>
                    )}
                    <p className={`text-xs font-mono truncate ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {item.content}
                    </p>
                  </div>
                </div>

                {!isSelectionMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      onToggleFavorite(item.id);
                    }}
                    aria-label={item.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                    className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                      item.isFavorite
                        ? 'text-emerald-500'
                        : isLight
                        ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Batch Delete Bar when selecting */}
      {isSelectionMode && (
        <div
          className={`px-4 py-3 border-t shrink-0 flex items-center justify-between gap-2 ${
            isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <span className="text-sm font-semibold tabular-nums">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={selectedIds.size === 0}
            aria-label="Delete selected records"
            className="min-h-[48px] px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Export Bottom Sheet */}
      <BottomSheet
        isOpen={isExportSheetOpen}
        onClose={() => setIsExportSheetOpen(false)}
        title="Export History"
        subtitle={`${records.length} records available`}
        theme={theme}
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleExport('json')}
            aria-label="Export history as JSON"
            className={`w-full min-h-[56px] px-4 py-3 border rounded-xl flex items-center justify-between transition cursor-pointer ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <FileCode className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">JSON (.json)</p>
                <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Structured backup of all records
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport('csv')}
            aria-label="Export history as CSV"
            className={`w-full min-h-[56px] px-4 py-3 border rounded-xl flex items-center justify-between transition cursor-pointer ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">CSV (.csv)</p>
                <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Spreadsheet compatible table
                </p>
              </div>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Confirm Clear All Bottom Sheet */}
      <BottomSheet
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Clear All History?"
        subtitle="This removes all saved scanned and generated codes."
        theme={theme}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(false)}
              className={`min-h-[48px] rounded-xl text-sm font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onClearAll();
                setIsClearConfirmOpen(false);
                onShowToast('All records cleared', 'info');
              }}
              className="min-h-[48px] rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            >
              Clear All
            </button>
          </div>
        }
      >
        <p className={`text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Export your history first if you want to keep a backup.
        </p>
      </BottomSheet>

      {/* Confirm Batch Delete Bottom Sheet */}
      <BottomSheet
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title={`Delete ${selectedIds.size} Selected?`}
        theme={theme}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className={`min-h-[48px] rounded-xl text-sm font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteSelected}
              className="min-h-[48px] rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className={`text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Selected records will be permanently removed from this device.
        </p>
      </BottomSheet>
    </div>
  );
};
