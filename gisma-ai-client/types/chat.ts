import { ResponseFormat } from './responseFormat';

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  messages: Message[];
  key: string;
  prompt: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  prompt: string;
  folderId?: string | null;
  responseFormat: ResponseFormat;
  schemaJson?: string;
  textDirection?: 'ltr' | 'rtl';
  chatId?: string;
}

// Backend types
export interface ChatMetadata {
  chatId: string;
  description: string;
}

export interface ChatMessage {
  content: string;
  type: 'USER' | 'ASSISTANT';
}
