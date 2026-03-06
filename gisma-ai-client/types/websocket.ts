export interface WebSocketMessage {
  type: 'chat';
  content: string;
  conversationId?: string;
}

export interface WebSocketResponse {
  type: 'response';
  content: string;
  isComplete: boolean;
  error?: string;
}

export interface WebSocketConfig {
  serverUrl: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface ChatStartResponse {
  chatId: string;
  description: string;
}