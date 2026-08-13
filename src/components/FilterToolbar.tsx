import React from 'react';
import { Search, Filter, CheckSquare, Square, Layers, ListFilter, CheckCircle2, Clock } from 'lucide-react';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  viewMode: 'list' | 'grouped';
  onViewModeChange: (mode: 'list' | 'grouped') => void;
  onSelectAllVisible: () => void;
  onSelectUnread: () => void;
  onDeselectAll: () => void;
  onMarkRead: () => void;
  totalVisible: number;
  selectedCount: number;
  unreadSelectedCount: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  viewMode,
  onViewModeChange,
  onSelectAllVisible,
  onSelectUnread,
  onDeselectAll,
  onMarkRead,
  totalVisible,
  selectedCount,
  unreadSelectedCount,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
      {/* Search and Main Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by sender, domain, or subject..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center space-x-2">
          {/* Grouping switch */}
          <div className="bg-slate-950 p-1 border border-slate-800 rounded-lg flex space-x-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Individual</span>
            </button>
            <button
              onClick={() => onViewModeChange('grouped')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                viewMode === 'grouped'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">By Sender</span>
            </button>
          </div>

          {unreadSelectedCount > 0 && (
            <button
              onClick={onMarkRead}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition border border-slate-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Mark Read ({unreadSelectedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Filter & Quick Selection Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
        {/* Date Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center space-x-1 mr-1">
            <Clock className="h-3 w-3" />
            <span>Age:</span>
          </span>
          {[
            { id: 'all', label: 'All Items' },
            { id: '30d', label: '> 30 Days' },
            { id: '90d', label: '> 90 Days' },
            { id: '1y', label: '> 1 Year' },
            { id: 'unread', label: 'Unread Only' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => onDateFilterChange(preset.id)}
              className={`px-2.5 py-1 rounded-full text-xs transition whitespace-nowrap ${
                dateFilter === preset.id
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Quick Selection Helpers */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSelectAllVisible}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition"
          >
            Select All ({totalVisible})
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={onSelectUnread}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium transition"
          >
            Select Unread
          </button>
          {selectedCount > 0 && (
            <>
              <span className="text-slate-700">•</span>
              <button
                onClick={onDeselectAll}
                className="text-xs text-slate-500 hover:text-slate-300 font-medium transition"
              >
                Clear ({selectedCount})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
