import { EmailMessage, UserProfile, UnsubscribeInfo } from '../types';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * Parse List-Unsubscribe header into HTTP and mailto URLs
 */
export function parseUnsubscribeHeader(rawHeader?: string): UnsubscribeInfo | null {
  if (!rawHeader) return null;

  const httpMatch = rawHeader.match(/<(https?:\/\/[^>]+)>/i);
  const mailtoMatch = rawHeader.match(/<(mailto:[^>]+)>/i);

  if (!httpMatch && !mailtoMatch) {
    if (rawHeader.startsWith('http://') || rawHeader.startsWith('https://')) {
      return { httpUrl: rawHeader.trim(), raw: rawHeader };
    }
    return { raw: rawHeader };
  }

  return {
    httpUrl: httpMatch ? httpMatch[1] : undefined,
    mailtoUrl: mailtoMatch ? mailtoMatch[1] : undefined,
    raw: rawHeader,
  };
}

/**
 * Fetch Gmail user profile
 */
export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${GMAIL_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error(`Failed to fetch user profile: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    email: data.emailAddress || 'User',
  };
}

/**
 * Extract header value by name (case-insensitive)
 */
function getHeader(headers: { name: string; value: string }[], name: string): string {
  if (!headers) return '';
  const target = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return target ? target.value : '';
}

/**
 * Parse From header into Name and Email
 */
function parseFromHeader(fromStr: string): { name: string; email: string } {
  if (!fromStr) return { name: 'Unknown Sender', email: '' };
  
  const match = fromStr.match(/(?:"?([^"]*)"?\s)?(?:<(.+)>)/);
  if (match) {
    const name = match[1]?.trim() || match[2].trim();
    const email = match[2].trim();
    return { name: name || email, email };
  }
  return { name: fromStr.trim(), email: fromStr.trim() };
}

/**
 * Fetch messages list and details
 */
export async function fetchCategoryMessages(
  token: string,
  query: string,
  maxResults: number = 100
): Promise<{ messages: EmailMessage[]; nextPageToken?: string }> {
  const url = `${GMAIL_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error(`Gmail API error (${res.status}): ${res.statusText}`);
  }

  const listData = await res.json();
  if (!listData.messages || listData.messages.length === 0) {
    return { messages: [] };
  }

  const rawMessages: { id: string; threadId: string }[] = listData.messages;
  
  // Fetch metadata details in chunks of 15 in parallel to avoid browser thread lock
  const CHUNK_SIZE = 15;
  const detailedMessages: EmailMessage[] = [];

  for (let i = 0; i < rawMessages.length; i += CHUNK_SIZE) {
    const chunk = rawMessages.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (item) => {
      try {
        const detailRes = await fetch(
          `${GMAIL_BASE}/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=List-Unsubscribe`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        
        const headers = detail.payload?.headers || [];
        const subject = getHeader(headers, 'Subject') || '(No Subject)';
        const fromRaw = getHeader(headers, 'From');
        const { name: fromName, email: fromEmail } = parseFromHeader(fromRaw);
        const dateRaw = getHeader(headers, 'Date');
        const listUnsubscribe = getHeader(headers, 'List-Unsubscribe');
        const unsubscribeInfo = parseUnsubscribeHeader(listUnsubscribe);
        
        const isUnread = detail.labelIds ? detail.labelIds.includes('UNREAD') : false;
        
        const dateObj = dateRaw ? new Date(dateRaw) : new Date(Number(detail.internalDate));
        const formattedDate = isNaN(dateObj.getTime())
          ? 'Unknown Date'
          : dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

        return {
          id: detail.id,
          threadId: detail.threadId,
          snippet: detail.snippet || '',
          subject,
          fromName,
          fromEmail,
          date: formattedDate,
          internalDate: Number(detail.internalDate) || dateObj.getTime(),
          labelIds: detail.labelIds || [],
          isUnread,
          sizeEstimate: detail.sizeEstimate || 1024,
          listUnsubscribe,
          unsubscribeInfo,
        } as EmailMessage;
      } catch (e) {
        console.error('Failed to fetch message detail for', item.id, e);
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.forEach((msg) => {
      if (msg) detailedMessages.push(msg);
    });
  }

  return {
    messages: detailedMessages,
    nextPageToken: listData.nextPageToken,
  };
}

/**
 * Move messages to Trash using batchModify
 */
export async function batchTrashMessages(
  token: string,
  messageIds: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const CHUNK_SIZE = 200;
  const total = messageIds.length;
  let processed = 0;

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = messageIds.slice(i, i + CHUNK_SIZE);
    
    const res = await fetch(`${GMAIL_BASE}/messages/batchModify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: chunk,
        addLabelIds: ['TRASH'],
        removeLabelIds: ['INBOX', 'SPAM', 'UNREAD', 'CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL'],
      }),
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('AUTH_EXPIRED');
      throw new Error(`Failed to trash messages: ${res.statusText}`);
    }

    processed += chunk.length;
    if (onProgress) onProgress(processed, total);
  }
}

/**
 * Permanently delete messages using batchDelete
 */
export async function batchDeleteMessages(
  token: string,
  messageIds: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const CHUNK_SIZE = 200;
  const total = messageIds.length;
  let processed = 0;

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = messageIds.slice(i, i + CHUNK_SIZE);

    const res = await fetch(`${GMAIL_BASE}/messages/batchDelete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: chunk,
      }),
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('AUTH_EXPIRED');
      throw new Error(`Failed to delete messages: ${res.statusText}`);
    }

    processed += chunk.length;
    if (onProgress) onProgress(processed, total);
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(token: string, messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;

  const res = await fetch(`${GMAIL_BASE}/messages/batchModify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: messageIds,
      removeLabelIds: ['UNREAD'],
    }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('AUTH_EXPIRED');
    throw new Error(`Failed to mark messages as read: ${res.statusText}`);
  }
}
