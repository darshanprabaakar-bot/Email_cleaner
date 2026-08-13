import React from 'react';
import { Mail, RefreshCw, LogOut, ShieldAlert, Sparkles, Inbox, Trash2, FolderSync } from 'lucide-react';
import { CategoryTab, UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  activeTab: CategoryTab;
  onSelectTab: (tab: CategoryTab) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
  needsAuth: boolean;
  onLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  onSelectTab,
  onRefresh,
  onLogout,
  isLoading,
  needsAuth,
  onLogin,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">Gmail Cleaner</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  Spam & Promo
                </span>
              </div>
              <p className="text-xs text-slate-400">Purge unwanted promotions and spam safely</p>
            </div>
          </div>

          {/* User Profile / Auth Action */}
          <div className="flex items-center space-x-3">
            {!needsAuth && user ? (
              <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/60 rounded-full pl-3 pr-1 py-1">
                <span className="text-xs font-medium text-slate-300 truncate max-w-[180px]">
                  {user.email}
                </span>
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  title="Scan & Sync Gmail"
                  className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
                </button>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg shadow-md transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Connect Gmail Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        {!needsAuth && (
          <div className="flex space-x-1 border-t border-slate-800 pt-2 pb-2 overflow-x-auto">
            <button
              onClick={() => onSelectTab('promotions')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'promotions'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-rose-400" />
              <span>Promotional Emails</span>
            </button>

            <button
              onClick={() => onSelectTab('spam')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'spam'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Spam Folder</span>
            </button>

            <button
              onClick={() => onSelectTab('social')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'social'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderSync className="h-3.5 w-3.5 text-indigo-400" />
              <span>Social & Updates</span>
            </button>

            <button
              onClick={() => onSelectTab('trash')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'trash'
                  ? 'bg-slate-700 text-slate-200 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Recently Trashed</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
