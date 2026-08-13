import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckSquare, Square, Mail, Layers, ShieldAlert, UserMinus } from 'lucide-react';
import { EmailMessage, SenderGroup } from '../types';

interface SenderGroupListProps {
  groups: SenderGroup[];
  selectedIds: Set<string>;
  onToggleGroupSelect: (groupMessages: EmailMessage[]) => void;
  onToggleSingleSelect: (id: string) => void;
  onPreviewEmail: (email: EmailMessage) => void;
  onUnsubscribeGroup?: (group: SenderGroup) => void;
}

export const SenderGroupList: React.FC<SenderGroupListProps> = ({
  groups,
  selectedIds,
  onToggleGroupSelect,
  onToggleSingleSelect,
  onPreviewEmail,
  onUnsubscribeGroup,
}) => {
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  const toggleAccordion = (emailKey: string) => {
    const next = new Set(expandedEmails);
    if (next.has(emailKey)) {
      next.delete(emailKey);
    } else {
      next.add(emailKey);
    }
    setExpandedEmails(next);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (groups.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
        No senders match your filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const allGroupSelected = group.messages.every((m) => selectedIds.has(m.id));
        const someGroupSelected = group.messages.some((m) => selectedIds.has(m.id));
        const isExpanded = expandedEmails.has(group.email);

        return (
          <div
            key={group.email}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-700"
          >
            {/* Sender Summary Bar */}
            <div className="p-4 bg-slate-900 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={() => onToggleGroupSelect(group.messages)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  title="Select all emails from this sender"
                >
                  {allGroupSelected ? (
                    <CheckSquare className="h-5 w-5 text-rose-500" />
                  ) : someGroupSelected ? (
                    <div className="h-5 w-5 rounded bg-rose-500/30 border border-rose-500 flex items-center justify-center text-xs text-rose-300 font-bold">
                      -
                    </div>
                  ) : (
                    <Square className="h-5 w-5 text-slate-600" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {group.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:inline">
                      ({group.email})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-3">
                    <span className="text-rose-400 font-medium">
                      {group.count} message{group.count !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>~{formatBytes(group.totalSize)} space</span>
                    {group.unreadCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">{group.unreadCount} unread</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {onUnsubscribeGroup && (
                  <button
                    onClick={() => onUnsubscribeGroup(group)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    title="Unsubscribe from this sender domain"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    <span>Unsubscribe</span>
                  </button>
                )}

                <button
                  onClick={() => toggleAccordion(group.email)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition border border-slate-700"
                >
                  <span>{isExpanded ? 'Hide' : 'View Emails'}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Nested List of Emails for this Sender */}
            {isExpanded && (
              <div className="bg-slate-950/60 border-t border-slate-800/80 divide-y divide-slate-800/40">
                {group.messages.map((msg) => {
                  const isSelected = selectedIds.has(msg.id);
                  return (
                    <div
                      key={msg.id}
                      className={`px-4 py-2.5 flex items-center justify-between text-xs transition ${
                        isSelected ? 'bg-rose-950/20' : 'hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <button
                          onClick={() => onToggleSingleSelect(msg.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-rose-500" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-600" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-200 truncate block">
                            {msg.subject}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {msg.snippet}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 ml-3">
                        <span className="text-[11px] text-slate-500 font-mono">{msg.date}</span>
                        <button
                          onClick={() => onPreviewEmail(msg)}
                          className="text-slate-400 hover:text-white transition"
                          title="Preview"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
