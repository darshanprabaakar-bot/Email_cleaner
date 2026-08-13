import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { FilterToolbar } from './components/FilterToolbar';
import { EmailList } from './components/EmailList';
import { SenderGroupList } from './components/SenderGroupList';
import { EmailDetailModal } from './components/EmailDetailModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { UnsubscribeConfirmationModal } from './components/UnsubscribeConfirmationModal';
import { Toast } from './components/Toast';

import {
  EmailMessage,
  CategoryTab,
  DeletionType,
  UserProfile,
  ScanStats,
  SenderGroup,
} from './types';
import {
  initAuthListener,
  googleSignIn,
  requestAccessTokenWithGIS,
  getAccessToken,
  setCachedAccessToken,
  logoutUser,
} from './services/firebaseAuth';
import {
  fetchUserProfile,
  fetchCategoryMessages,
  batchTrashMessages,
  batchDeleteMessages,
  markMessagesAsRead,
  parseUnsubscribeHeader,
} from './services/gmailApi';
import { Sparkles, RefreshCw, Mail, ShieldAlert, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email data states
  const [activeTab, setActiveTab] = useState<CategoryTab>('promotions');
  const [messagesMap, setMessagesMap] = useState<Record<CategoryTab, EmailMessage[]>>({
    promotions: [],
    spam: [],
    social: [],
    trash: [],
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [previewEmail, setPreviewEmail] = useState<EmailMessage | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalDeletionType, setModalDeletionType] = useState<DeletionType>('trash');
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ processed: 0, total: 0 });

  // Unsubscribe modal state
  const [isUnsubModalOpen, setIsUnsubModalOpen] = useState(false);
  const [isProcessingUnsub, setIsProcessingUnsub] = useState(false);
  const [unsubProgress, setUnsubProgress] = useState({ processed: 0, total: 0 });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuthListener(
      async (firebaseUser, cachedToken) => {
        setUser({
          email: firebaseUser.email || 'User',
          name: firebaseUser.displayName || undefined,
          photoUrl: firebaseUser.photoURL || undefined,
        });

        if (cachedToken) {
          setToken(cachedToken);
          setNeedsAuth(false);
          loadAllCategories(cachedToken);
        } else {
          setNeedsAuth(true);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Login via Firebase or GIS Fallback
  const handleLogin = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        setNeedsAuth(false);
        setUser({
          email: res.user.email || 'User',
          name: res.user.displayName || undefined,
          photoUrl: res.user.photoURL || undefined,
        });
        await loadAllCategories(res.accessToken);
      }
    } catch (err: any) {
      console.warn('Firebase login failed or popup blocked, attempting GIS fallback:', err);
      try {
        const gisToken = await requestAccessTokenWithGIS();
        setToken(gisToken);
        setNeedsAuth(false);
        const profile = await fetchUserProfile(gisToken);
        setUser(profile);
        await loadAllCategories(gisToken);
      } catch (gisErr: any) {
        console.error('GIS fallback login error:', gisErr);
        setAuthError(gisErr.message || 'Failed to authenticate with Google. Please allow popups.');
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setMessagesMap({ promotions: [], spam: [], social: [], trash: [] });
    setSelectedIds(new Set());
  };

  // Load all Gmail categories
  const loadAllCategories = async (authToken: string) => {
    setIsLoading(true);
    try {
      const [promoRes, spamRes, socialRes, trashRes] = await Promise.all([
        fetchCategoryMessages(authToken, 'category:promotions', 100),
        fetchCategoryMessages(authToken, 'in:spam', 100),
        fetchCategoryMessages(authToken, 'category:social', 50),
        fetchCategoryMessages(authToken, 'in:trash', 50),
      ]);

      setMessagesMap({
        promotions: promoRes.messages,
        spam: spamRes.messages,
        social: socialRes.messages,
        trash: trashRes.messages,
      });

      setSelectedIds(new Set());
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        setToast({ message: 'Session expired. Please reconnect your Gmail.', type: 'error' });
        setNeedsAuth(true);
      } else {
        setToast({ message: `Error loading emails: ${err.message}`, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter messages for active tab
  const currentCategoryMessages = messagesMap[activeTab] || [];

  const filteredMessages = useMemo(() => {
    let list = currentCategoryMessages;

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.fromName.toLowerCase().includes(q) ||
          m.fromEmail.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
      );
    }

    // Date Filter
    const now = Date.now();
    if (dateFilter === '30d') {
      const threshold = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((m) => m.internalDate < threshold);
    } else if (dateFilter === '90d') {
      const threshold = now - 90 * 24 * 60 * 60 * 1000;
      list = list.filter((m) => m.internalDate < threshold);
    } else if (dateFilter === '1y') {
      const threshold = now - 365 * 24 * 60 * 60 * 1000;
      list = list.filter((m) => m.internalDate < threshold);
    } else if (dateFilter === 'unread') {
      list = list.filter((m) => m.isUnread);
    }

    return list;
  }, [currentCategoryMessages, searchQuery, dateFilter]);

  // Group messages by sender email
  const senderGroups: SenderGroup[] = useMemo(() => {
    const map: Record<string, EmailMessage[]> = {};
    filteredMessages.forEach((m) => {
      const key = m.fromEmail.toLowerCase() || 'unknown';
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });

    return Object.entries(map)
      .map(([email, msgs]) => {
        const first = msgs[0];
        const domain = email.includes('@') ? email.split('@')[1] : email;
        const totalSize = msgs.reduce((acc, curr) => acc + curr.sizeEstimate, 0);
        const unreadCount = msgs.filter((m) => m.isUnread).length;

        return {
          email,
          name: first.fromName || email,
          domain,
          count: msgs.length,
          messages: msgs,
          totalSize,
          unreadCount,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredMessages]);

  // Overall Stats
  const scanStats: ScanStats = useMemo(() => {
    const promoCount = messagesMap.promotions.length;
    const spamCount = messagesMap.spam.length;
    const socialCount = messagesMap.social.length;
    const unreadPromoCount = messagesMap.promotions.filter((m) => m.isUnread).length;
    const estimatedSize =
      promoCount * 12500 + spamCount * 14000 + socialCount * 11000;

    return {
      promoCount,
      spamCount,
      socialCount,
      unreadPromoCount,
      estimatedSize,
    };
  }, [messagesMap]);

  // Selected Size calculation
  const selectedSize = useMemo(() => {
    let size = 0;
    const allMessages = [
      ...messagesMap.promotions,
      ...messagesMap.spam,
      ...messagesMap.social,
      ...messagesMap.trash,
    ];

    selectedIds.forEach((id) => {
      const found = allMessages.find((m) => m.id === id);
      if (found) size += found.sizeEstimate;
    });

    return size;
  }, [selectedIds, messagesMap]);

  // Unread count in active selection
  const unreadSelectedCount = useMemo(() => {
    let count = 0;
    filteredMessages.forEach((m) => {
      if (selectedIds.has(m.id) && m.isUnread) count++;
    });
    return count;
  }, [selectedIds, filteredMessages]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleToggleSelectAllVisible = () => {
    const allSelected = filteredMessages.every((m) => selectedIds.has(m.id));
    const next = new Set(selectedIds);

    if (allSelected) {
      filteredMessages.forEach((m) => next.delete(m.id));
    } else {
      filteredMessages.forEach((m) => next.add(m.id));
    }
    setSelectedIds(next);
  };

  const handleSelectUnread = () => {
    const next = new Set(selectedIds);
    filteredMessages.forEach((m) => {
      if (m.isUnread) next.add(m.id);
    });
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleGroupSelect = (groupMessages: EmailMessage[]) => {
    const allSelected = groupMessages.every((m) => selectedIds.has(m.id));
    const next = new Set(selectedIds);

    if (allSelected) {
      groupMessages.forEach((m) => next.delete(m.id));
    } else {
      groupMessages.forEach((m) => next.add(m.id));
    }
    setSelectedIds(next);
  };

  // Mark selected as read
  const handleMarkRead = async () => {
    if (!token) return;
    const idsToMark = filteredMessages.filter((m) => selectedIds.has(m.id) && m.isUnread).map((m) => m.id);
    if (idsToMark.length === 0) return;

    try {
      await markMessagesAsRead(token, idsToMark);
      // Local state update
      setMessagesMap((prev) => {
        const next = { ...prev };
        next[activeTab] = next[activeTab].map((m) =>
          idsToMark.includes(m.id) ? { ...m, isUnread: false } : m
        );
        return next;
      });
      setToast({ message: `Marked ${idsToMark.length} email(s) as read.`, type: 'success' });
    } catch (err: any) {
      setToast({ message: `Failed to mark emails as read: ${err.message}`, type: 'error' });
    }
  };

  // Open confirmation modal
  const handleOpenTrashModal = () => {
    setModalDeletionType('trash');
    setIsDeleteModalOpen(true);
  };

  const handleOpenPermanentDeleteModal = () => {
    setModalDeletionType('permanent');
    setIsDeleteModalOpen(true);
  };

  // Confirm and execute batch deletion
  const handleConfirmBatchDelete = async (type: DeletionType) => {
    if (!token || selectedIds.size === 0) return;

    const idsList: string[] = Array.from(selectedIds);
    setIsProcessingDelete(true);
    setDeleteProgress({ processed: 0, total: idsList.length });

    try {
      if (type === 'trash') {
        await batchTrashMessages(token, idsList, (processed, total) => {
          setDeleteProgress({ processed, total });
        });
      } else {
        await batchDeleteMessages(token, idsList, (processed, total) => {
          setDeleteProgress({ processed, total });
        });
      }

      // Remove deleted messages from local state
      setMessagesMap((prev) => {
        const next = { ...prev };
        const categories: CategoryTab[] = ['promotions', 'spam', 'social', 'trash'];
        categories.forEach((tabKey) => {
          next[tabKey] = next[tabKey].filter((m) => !selectedIds.has(m.id));
        });
        return next;
      });

      const count = idsList.length;
      setSelectedIds(new Set());
      setIsDeleteModalOpen(false);

      if (type === 'trash') {
        setToast({
          message: `Successfully moved ${count} email(s) to Gmail Trash.`,
          type: 'success',
        });
      } else {
        setToast({
          message: `Permanently deleted ${count} email(s) from your Gmail account.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Deletion error:', err);
      setToast({ message: `Deletion failed: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessingDelete(false);
    }
  };

  // Single message trash action from preview modal
  const handleTrashSingle = async (id: string) => {
    if (!token) return;
    try {
      await batchTrashMessages(token, [id]);
      setMessagesMap((prev) => {
        const next = { ...prev };
        const categories: CategoryTab[] = ['promotions', 'spam', 'social', 'trash'];
        categories.forEach((tabKey) => {
          next[tabKey] = next[tabKey].filter((m) => m.id !== id);
        });
        return next;
      });
      setToast({ message: 'Email moved to Trash.', type: 'success' });
    } catch (err: any) {
      setToast({ message: `Failed to move email to trash: ${err.message}`, type: 'error' });
    }
  };

  // Selected Email Messages array
  const selectedMessages = useMemo(() => {
    const allMessages = [
      ...messagesMap.promotions,
      ...messagesMap.spam,
      ...messagesMap.social,
      ...messagesMap.trash,
    ];
    return allMessages.filter((m) => selectedIds.has(m.id));
  }, [selectedIds, messagesMap]);

  // Handle single email unsubscribe action
  const handleUnsubscribeEmail = async (email: EmailMessage, moveTrash: boolean = false) => {
    const unsubInfo = email.unsubscribeInfo || parseUnsubscribeHeader(email.listUnsubscribe);
    let openedLink = false;

    if (unsubInfo?.httpUrl) {
      window.open(unsubInfo.httpUrl, '_blank', 'noopener,noreferrer');
      openedLink = true;
    } else if (unsubInfo?.mailtoUrl) {
      window.location.href = unsubInfo.mailtoUrl;
      openedLink = true;
    } else if (email.listUnsubscribe) {
      const match = email.listUnsubscribe.match(/<(https?:\/\/[^>]+)>/i);
      if (match) {
        window.open(match[1], '_blank', 'noopener,noreferrer');
        openedLink = true;
      }
    } else {
      // Fallback search link for promotional email
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent('unsubscribe ' + email.fromName + ' ' + email.fromEmail)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
      openedLink = true;
    }

    if (moveTrash && token) {
      await handleTrashSingle(email.id);
      setToast({
        message: openedLink
          ? 'Opened unsubscribe page & moved email to Trash.'
          : 'Moved email to Trash.',
        type: 'success',
      });
    } else {
      setToast({
        message: openedLink
          ? `Opened sender unsubscribe page for ${email.fromName}.`
          : `Initiated unsubscribe for ${email.fromName}.`,
        type: 'success',
      });
    }
  };

  // Handle group unsubscribe action
  const handleUnsubscribeGroup = async (group: SenderGroup) => {
    const unsubMsg = group.messages.find((m) => !!m.unsubscribeInfo || !!m.listUnsubscribe) || group.messages[0];
    if (unsubMsg) {
      handleUnsubscribeEmail(unsubMsg);
    }

    // Automatically select all emails from this sender so user can trash them if desired
    const groupIds = group.messages.map((m) => m.id);
    const next = new Set(selectedIds);
    groupIds.forEach((id) => next.add(id));
    setSelectedIds(next);
  };

  // Open batch unsubscribe modal
  const handleOpenUnsubscribeModal = () => {
    setIsUnsubModalOpen(true);
  };

  // Execute batch unsubscribe for selected senders
  const handleConfirmBatchUnsubscribe = async (moveTrash: boolean) => {
    const unsubscribable = selectedMessages.filter(
      (m) => !!m.unsubscribeInfo || !!m.listUnsubscribe
    );

    const targetList = unsubscribable.length > 0 ? unsubscribable : selectedMessages;
    if (targetList.length === 0) return;

    setIsProcessingUnsub(true);
    setUnsubProgress({ processed: 0, total: targetList.length });

    let processedCount = 0;
    for (const msg of targetList) {
      const unsubInfo = msg.unsubscribeInfo || parseUnsubscribeHeader(msg.listUnsubscribe);
      if (unsubInfo?.httpUrl) {
        window.open(unsubInfo.httpUrl, '_blank', 'noopener,noreferrer');
      } else if (unsubInfo?.mailtoUrl) {
        window.location.href = unsubInfo.mailtoUrl;
      }
      processedCount++;
      setUnsubProgress({ processed: processedCount, total: targetList.length });
      await new Promise((r) => setTimeout(r, 150));
    }

    if (moveTrash && token && selectedIds.size > 0) {
      const idsList: string[] = Array.from(selectedIds);
      await batchTrashMessages(token, idsList);
      setMessagesMap((prev) => {
        const next = { ...prev };
        const categories: CategoryTab[] = ['promotions', 'spam', 'social', 'trash'];
        categories.forEach((tabKey) => {
          next[tabKey] = next[tabKey].filter((m) => !selectedIds.has(m.id));
        });
        return next;
      });
    }

    setIsProcessingUnsub(false);
    setIsUnsubModalOpen(false);
    const totalCount = targetList.length;
    setSelectedIds(new Set());

    setToast({
      message: moveTrash
        ? `Unsubscribed ${totalCount} sender(s) and moved emails to Trash!`
        : `Triggered unsubscribe for ${totalCount} sender(s)!`,
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedIds(new Set());
        }}
        onRefresh={() => token && loadAllCategories(token)}
        onLogout={handleLogout}
        isLoading={isLoading}
        needsAuth={needsAuth}
        onLogin={handleLogin}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Unauthenticated Landing / Sign In Card */}
        {needsAuth ? (
          <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="h-16 w-16 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-rose-950/50">
                <Mail className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                  Gmail Spam & Promotions Cleaner
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Connect your Google account to scan promotional offers, marketing newsletters, and spam emails. Clean up your inbox and reclaim storage space safely.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center space-x-2 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Material Sign in with Google Button */}
              <div className="pt-2">
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm px-6 py-3.5 rounded-xl shadow-xl transition transform active:scale-95 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting to Gmail...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center space-x-1">
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                <span>Requires explicit user confirmation before any email is deleted</span>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-6">
            {/* Overview Stats Bar */}
            <StatCards
              stats={scanStats}
              selectedCount={selectedIds.size}
              selectedSize={selectedSize}
              activeTab={activeTab}
              onOpenTrashModal={handleOpenTrashModal}
              onOpenPermanentDeleteModal={handleOpenPermanentDeleteModal}
              onSelectAllTabMessages={handleToggleSelectAllVisible}
              onOpenUnsubscribeModal={handleOpenUnsubscribeModal}
            />

            {/* Filter & View Mode Controls */}
            <FilterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSelectAllVisible={handleToggleSelectAllVisible}
              onSelectUnread={handleSelectUnread}
              onDeselectAll={handleDeselectAll}
              onOpenUnsubscribeModal={handleOpenUnsubscribeModal}
              onOpenTrashModal={handleOpenTrashModal}
              onMarkRead={handleMarkRead}
              totalVisible={filteredMessages.length}
              selectedCount={selectedIds.size}
              unreadSelectedCount={unreadSelectedCount}
            />

            {/* Email List or Grouped Sender View */}
            {viewMode === 'list' ? (
              <EmailList
                messages={filteredMessages}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAllVisible}
                onPreviewEmail={setPreviewEmail}
                onUnsubscribe={handleUnsubscribeEmail}
                isLoading={isLoading}
                categoryName={activeTab}
              />
            ) : (
              <SenderGroupList
                groups={senderGroups}
                selectedIds={selectedIds}
                onToggleGroupSelect={handleToggleGroupSelect}
                onToggleSingleSelect={handleToggleSelect}
                onPreviewEmail={setPreviewEmail}
                onUnsubscribeGroup={handleUnsubscribeGroup}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <p>© Gmail Cleaner App — Safe & Explicit Email Management</p>
      </footer>

      {/* Preview Detail Modal */}
      <EmailDetailModal
        email={previewEmail}
        onClose={() => setPreviewEmail(null)}
        onTrashSingle={handleTrashSingle}
        onUnsubscribeEmail={handleUnsubscribeEmail}
      />

      {/* Batch Unsubscribe Confirmation Modal */}
      <UnsubscribeConfirmationModal
        isOpen={isUnsubModalOpen}
        onClose={() => !isProcessingUnsub && setIsUnsubModalOpen(false)}
        selectedMessages={selectedMessages}
        onConfirmBatchUnsubscribe={handleConfirmBatchUnsubscribe}
        isProcessing={isProcessingUnsub}
        progress={unsubProgress}
      />

      {/* Mandatory Explicit User Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isProcessingDelete && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        selectedCount={selectedIds.size}
        selectedSize={selectedSize}
        deletionType={modalDeletionType}
        isProcessing={isProcessingDelete}
        progress={deleteProgress}
      />

      {/* Toast Feedback */}
      <Toast
        message={toast?.message || null}
        type={toast?.type || 'info'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
