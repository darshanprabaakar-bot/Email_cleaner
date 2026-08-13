import React from 'react';
import { Mail, ShieldAlert, CheckSquare, HardDrive, Trash2, ShieldX } from 'lucide-react';
import { ScanStats, CategoryTab } from '../types';

interface StatCardsProps {
  stats: ScanStats;
  selectedCount: number;
  selectedSize: number;
  activeTab: CategoryTab;
  onOpenTrashModal: () => void;
  onOpenPermanentDeleteModal: () => void;
  onSelectAllTabMessages: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  selectedCount,
  selectedSize,
  activeTab,
  onOpenTrashModal,
  onOpenPermanentDeleteModal,
  onSelectAllTabMessages,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {/* Promo Card */}
      <div
        className={`p-4 rounded-xl border transition ${
          activeTab === 'promotions'
            ? 'bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-rose-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Promotional</span>
          <Mail className="h-4 w-4" />
        </div>
        <div className="text-2xl font-extrabold text-white">{stats.promoCount}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
          <span>{stats.unreadPromoCount} unread</span>
          <span>~{formatBytes(stats.promoCount * 12500)}</span>
        </div>
      </div>

      {/* Spam Card */}
      <div
        className={`p-4 rounded-xl border transition ${
          activeTab === 'spam'
            ? 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-950/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-amber-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Spam Folder</span>
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="text-2xl font-extrabold text-white">{stats.spamCount}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
          <span>High risk emails</span>
          <span>~{formatBytes(stats.spamCount * 14000)}</span>
        </div>
      </div>

      {/* Social / Updates Card */}
      <div
        className={`p-4 rounded-xl border transition ${
          activeTab === 'social'
            ? 'bg-indigo-950/30 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-indigo-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Social & Newsletters</span>
          <HardDrive className="h-4 w-4" />
        </div>
        <div className="text-2xl font-extrabold text-white">{stats.socialCount}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
          <span>Automated updates</span>
          <span>~{formatBytes(stats.socialCount * 11000)}</span>
        </div>
      </div>

      {/* Action Box / Selection Summary */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-300 mb-1">
          <div className="flex items-center space-x-1.5">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Selected ({selectedCount})
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">{formatBytes(selectedSize)}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onOpenTrashModal}
            disabled={selectedCount === 0}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-sm transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Move to Trash</span>
          </button>

          <button
            onClick={onOpenPermanentDeleteModal}
            disabled={selectedCount === 0}
            className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-300 border border-slate-700 disabled:opacity-40 rounded-lg transition"
            title="Permanently Delete"
          >
            <ShieldX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
