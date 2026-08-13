import React, { useState } from 'react';
import { UserMinus, RefreshCw } from 'lucide-react';
import { EmailMessage } from '../types';

interface UnsubscribeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMessages: EmailMessage[];
  onConfirmBatchUnsubscribe: (moveTrash: boolean) => void;
  isProcessing: boolean;
  progress: { processed: number; total: number };
}

export const UnsubscribeConfirmationModal: React.FC<UnsubscribeConfirmationModalProps> = ({
  isOpen,
  onClose,
  selectedMessages,
  onConfirmBatchUnsubscribe,
  isProcessing,
  progress,
}) => {
  const [alsoMoveToTrash, setAlsoMoveToTrash] = useState(true);

  if (!isOpen) return null;

  const unsubscribableMessages = selectedMessages.filter(
    (m) => !!m.unsubscribeInfo || !!m.listUnsubscribe
  );

  const targetList = unsubscribableMessages.length > 0 ? unsubscribableMessages : selectedMessages;
  const missingUnsubCount = selectedMessages.length - unsubscribableMessages.length;

  const progressPercent =
    progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
        {/* Modal Header */}
        <div className="p-5 border-b border-rose-500/30 bg-rose-950/40 text-rose-400 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300">
            <UserMinus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Batch Unsubscribe Senders</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Opt-out of marketing emails from selected messages
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {isProcessing ? (
            <div className="space-y-3 py-4 text-center">
              <RefreshCw className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Processing Batch Unsubscribe...
                </p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Processed {progress.processed} of {progress.total} senders ({progressPercent}%)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500">Selected Messages:</span>
                  <span className="font-bold text-slate-200">{selectedMessages.length} email(s)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500">Unsubscribe Links Found:</span>
                  <span className="font-bold text-emerald-400">
                    {unsubscribableMessages.length} sender(s)
                  </span>
                </div>
                {missingUnsubCount > 0 && (
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span className="text-slate-500">Without Direct Header Link:</span>
                    <span className="text-amber-400">{missingUnsubCount} email(s)</span>
                  </div>
                )}
              </div>

              {/* Senders List Preview */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Senders ({targetList.length})
                </label>
                <div className="max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/50 text-xs">
                  {targetList.slice(0, 8).map((msg) => (
                    <div key={msg.id} className="py-1.5 px-2 flex items-center justify-between">
                      <div className="truncate min-w-0 pr-2">
                        <span className="font-semibold text-slate-200 block truncate">
                          {msg.fromName}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {msg.fromEmail}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono shrink-0">
                        {msg.unsubscribeInfo || msg.listUnsubscribe ? 'Header Ready' : 'Search Fallback'}
                      </span>
                    </div>
                  ))}
                  {targetList.length > 8 && (
                    <div className="py-1 text-center text-[11px] text-slate-500">
                      + {targetList.length - 8} more senders
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox: Also move unsubscribed emails to trash */}
              <label className="flex items-start space-x-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={alsoMoveToTrash}
                  onChange={(e) => setAlsoMoveToTrash(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-slate-100 block">
                    Also move these emails to Trash
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                    Clean your inbox immediately by trashing all selected emails after triggering unsubscribe requests.
                  </span>
                </div>
              </label>
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
              onClick={() => onConfirmBatchUnsubscribe(alsoMoveToTrash)}
              disabled={selectedMessages.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center space-x-1.5"
            >
              <UserMinus className="h-4 w-4" />
              <span>Unsubscribe {targetList.length} Sender(s)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
