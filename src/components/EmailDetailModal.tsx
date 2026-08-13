import React from 'react';
import { X, Mail, Calendar, User, Tag, ExternalLink, Trash2, ShieldAlert, UserMinus, Send } from 'lucide-react';
import { EmailMessage } from '../types';

interface EmailDetailModalProps {
  email: EmailMessage | null;
  onClose: () => void;
  onTrashSingle: (id: string) => void;
  onUnsubscribeEmail?: (email: EmailMessage, moveTrash: boolean) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  onClose,
  onTrashSingle,
  onUnsubscribeEmail,
}) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <Mail className="h-4 w-4" />
            <span>Email Details</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Subject Line */}
          <div>
            <h2 className="text-lg font-bold text-slate-100">{email.subject}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {email.labelIds.map((lbl) => (
                <span
                  key={lbl}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          {/* Sender & Date Info */}
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-rose-400" /> From:
              </span>
              <span className="font-semibold">{email.fromName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
              <span className="text-slate-500">Address:</span>
              <span>{email.fromEmail}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Received:
              </span>
              <span>{email.date}</span>
            </div>
          </div>

          {/* Snippet / Preview Body */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Content Preview
            </label>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {email.snippet || 'No preview text available for this message.'}
            </div>
          </div>

          {/* Unsubscribe options */}
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
              <UserMinus className="h-4 w-4" />
              <span>Promotional Unsubscribe Option</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Opt-out of promotional communications from {email.fromName} ({email.fromEmail}).
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {email.unsubscribeInfo?.httpUrl && (
                <a
                  href={email.unsubscribeInfo.httpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Unsubscribe Page</span>
                </a>
              )}

              {email.unsubscribeInfo?.mailtoUrl && (
                <a
                  href={email.unsubscribeInfo.mailtoUrl}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Unsubscribe Mail</span>
                </a>
              )}

              {onUnsubscribeEmail && (
                <button
                  onClick={() => {
                    onUnsubscribeEmail(email, true);
                    onClose();
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition shadow"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Unsubscribe & Move to Trash</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
          >
            Close
          </button>

          <button
            onClick={() => {
              onTrashSingle(email.id);
              onClose();
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition shadow-md"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Move This Email to Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
