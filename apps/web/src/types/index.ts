export type UserStatus = "online" | "offline";

export interface UserSummary {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastSeen: string | null;
  lastMessageSnippet?: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: UserSummary;
  receiver: UserSummary;
}

export interface AuthSession {
  token: string;
  user: UserSummary;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PresencePayload {
  userId: string;
  status: UserStatus;
  lastSeen: string | null;
}

export interface ToastItem {
  id: string;
  title: string;
  description: string;
}
