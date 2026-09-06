export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'action';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Interaction {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  category: ReflectionMode;
  summary?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  modelUsed?: string;
}

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
