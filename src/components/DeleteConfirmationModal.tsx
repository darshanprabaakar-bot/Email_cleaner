import React, { useState } from 'react';
import { AlertTriangle, Trash2, ShieldX, Check, X, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { DeletionType } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: DeletionType) => void;
  selectedCount: number;
  selectedSize: number;
  deletionType: DeletionType;
  isProcessing: boolean;
  progress: { processed: number; total: number };
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  selectedSize,
  deletionType,
  isProcessing,
  progress,
}) => {
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  if (!isOpen) return null;

  const isPermanent = deletionType === 'permanent';

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const progressPercent =
    progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex items-center space-x-3 ${
            isPermanent
              ? 'bg-red-950/40 border-red-500/30 text-red-400'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              isPermanent ? 'bg-red-500/20 text-red-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {isPermanent ? <ShieldX className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {isPermanent ? 'Confirm Permanent Deletion' : 'Move Selected Emails to Trash'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPermanent ? 'Irreversible Gmail action' : 'Safe 30-day trash retention'}
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Progress state during batch processing */}
          {isProcessing ? (
            <div className="space-y-3 py-4 text-center">
              <RefreshCw className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {isPermanent ? 'Permanently deleting emails...' : 'Moving emails to Trash...'}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Processed {progress.processed} of {progress.total} emails ({progressPercent}%)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-rose-600 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats Box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500">Selected Count:</span>
                  <span className="font-bold text-rose-400">{selectedCount} email(s)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500">Storage to Reclaim:</span>
                  <span className="font-mono font-bold text-slate-200">
                    ~{formatBytes(selectedSize)}
                  </span>
                </div>
              </div>

              {/* Notice / Warning Box */}
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                  isPermanent
                    ? 'bg-red-950/30 border border-red-500/30 text-red-300'
                    : 'bg-slate-950 border border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{isPermanent ? 'WARNING: PERMANENT ACTION' : 'Gmail Trash Policy'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isPermanent
                    ? 'Permanent deletion removes these emails immediately from your Google account. This CANNOT be undone or restored.'
                    : 'Emails moved to Trash can be recovered within 30 days from your Gmail Trash folder before Gmail permanently removes them.'}
                </p>
              </div>

              {/* Permanent deletion checkbox verification */}
              {isPermanent && (
                <label className="flex items-start space-x-2.5 p-3 bg-red-950/20 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-950/30 transition">
                  <input
                    type="checkbox"
                    checked={confirmedCheck}
                    onChange={(e) => setConfirmedCheck(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-200 font-medium leading-tight">
                    I understand that permanently deleting {selectedCount} email(s) cannot be reversed.
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        {/* Modal Actions */}
        {!isProcessing && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirm(deletionType)}
              disabled={isPermanent && !confirmedCheck}
              className={`px-4 py-2 font-semibold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 ${
                isPermanent
                  ? 'bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isPermanent ? <ShieldX className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>
                {isPermanent ? 'Delete Permanently Now' : 'Confirm Move to Trash'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
