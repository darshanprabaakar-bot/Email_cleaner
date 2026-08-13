import React from 'react';
import { Mail, Eye, CheckSquare, Square, Calendar, ExternalLink, Sparkles, AlertCircle, UserMinus } from 'lucide-react';
import { EmailMessage } from '../types';

interface EmailListProps {
  messages: EmailMessage[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPreviewEmail: (email: EmailMessage) => void;
  onUnsubscribe?: (email: EmailMessage) => void;
  isLoading: boolean;
  categoryName: string;
}

export const EmailList: React.FC<EmailListProps> = ({
  messages,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPreviewEmail,
  onUnsubscribe,
  isLoading,
  categoryName,
}) => {
  const allSelected = messages.length > 0 && messages.every((m) => selectedIds.has(m.id));
  const someSelected = messages.some((m) => selectedIds.has(m.id));

  if (isLoading && messages.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent mb-3" />
        <p className="text-sm text-slate-300 font-medium">Scanning {categoryName} emails from Gmail...</p>
        <p className="text-xs text-slate-500 mt-1">Fetching metadata and sorting senders</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No {categoryName} Emails Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Your inbox is clean or no messages match your active filter criteria. Try changing the filter age or tab.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Table Header / Select All */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSelectAll}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-rose-500" />
            ) : someSelected ? (
              <div className="h-4 w-4 rounded bg-rose-500/30 border border-rose-500 flex items-center justify-center text-[10px] text-rose-300 font-bold">
                -
              </div>
            ) : (
              <Square className="h-4 w-4 text-slate-600" />
            )}
            <span className="text-xs">
              {allSelected ? 'Deselect All' : `Select All (${messages.length})`}
            </span>
          </button>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Showing {messages.length} email{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Email List Rows */}
      <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
        {messages.map((msg) => {
          const isSelected = selectedIds.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`p-3 sm:px-4 sm:py-3.5 flex items-start sm:items-center justify-between gap-3 transition group ${
                isSelected
                  ? 'bg-rose-950/20 hover:bg-rose-950/30'
                  : msg.isUnread
                  ? 'bg-slate-900 hover:bg-slate-850'
                  : 'bg-slate-900/40 hover:bg-slate-850/60'
              }`}
            >
              {/* Checkbox & Sender info */}
              <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                <button
                  onClick={() => onToggleSelect(msg.id)}
                  className="mt-0.5 sm:mt-0 text-slate-500 hover:text-rose-400 transition"
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                  )}
                </button>

                {/* Unread indicator */}
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {msg.isUnread && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Unread" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-semibold truncate ${
                          msg.isUnread ? 'text-slate-100' : 'text-slate-300'
                        }`}
                      >
                        {msg.fromName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                        &lt;{msg.fromEmail}&gt;
                      </span>
                    </div>

                    {/* Subject & Snippet */}
                    <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                      {msg.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {msg.snippet}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right metadata & Action */}
              <div className="flex items-center space-x-2 shrink-0">
                {(msg.unsubscribeInfo || msg.listUnsubscribe || categoryName === 'promotions') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUnsubscribe) {
                        onUnsubscribe(msg);
                      } else {
                        onPreviewEmail(msg);
                      }
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm transition"
                    title="Unsubscribe from this sender"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    <span>Unsubscribe</span>
                  </button>
                )}

                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                  {msg.date}
                </span>

                <button
                  onClick={() => onPreviewEmail(msg)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  title="View Email Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
