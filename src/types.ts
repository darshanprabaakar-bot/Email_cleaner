export interface GmailHeader {
  name: string;
  value: string;
}

export interface UnsubscribeInfo {
  httpUrl?: string;
  mailtoUrl?: string;
  raw: string;
}

export interface GmailMessagePayload {
  headers: GmailHeader[];
  body?: {
    size: number;
    data?: string;
  };
  snippet?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  date: string; // ISO or formatted
  internalDate: number; // Timestamp ms
  labelIds: string[];
  isUnread: boolean;
  sizeEstimate: number;
  listUnsubscribe?: string;
  unsubscribeInfo?: UnsubscribeInfo | null;
}

export interface SenderGroup {
  email: string;
  name: string;
  domain: string;
  count: number;
  messages: EmailMessage[];
  totalSize: number;
  unreadCount: number;
  unsubscribeInfo?: UnsubscribeInfo | null;
}

export interface ScanStats {
  promoCount: number;
  spamCount: number;
  socialCount: number;
  unreadPromoCount: number;
  estimatedSize: number;
}

export type CategoryTab = 'promotions' | 'spam' | 'social' | 'trash';

export type DeletionType = 'trash' | 'permanent';

export interface UserProfile {
  email: string;
  name?: string;
  photoUrl?: string;
}
