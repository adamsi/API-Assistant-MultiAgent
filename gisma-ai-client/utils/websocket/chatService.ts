import { WebSocketManager } from './WebSocketManager';
import { WebSocketResponse, ChatStartResponse } from '../../types/websocket';
import { WEBSOCKET_CONFIG } from './config';

/**
 * Simple Chat Service - Singleton, always connected
 */
export class ChatService {
  private static instance: ChatService | null = null;
  private wsManager: WebSocketManager;
  private isAuthenticated: boolean = false;
  private currentChatId: string | null = null;

  private constructor(serverUrl: string = WEBSOCKET_CONFIG.SERVER_URL) {
    this.wsManager = WebSocketManager.getInstance({
      serverUrl,
      reconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
      reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
    });
  }

  public static getInstance(serverUrl?: string): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService(serverUrl);
    }
    return ChatService.instance;
  }

  public setAuthenticated(authenticated: boolean): void {
    this.isAuthenticated = authenticated;
    if (!authenticated) {
      this.wsManager.disconnect();
    }
  }

  public async connect(): Promise<void> {
    if (this.isAuthenticated) {
      await this.wsManager.connect();
    }
  }

  public async startNewChat(
    message: string,
    responseFormat: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    onMetadata: (metadata: ChatStartResponse) => void,
    schemaJson?: string
  ): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    this.cleanup();

    // Subscribe to metadata first
    this.wsManager.subscribeToMetadata((metadata: ChatStartResponse) => {
      onMetadata(metadata);
      this.currentChatId = metadata.chatId;
      
      // Subscribe to chat queue
      const replyDestination = `/user/queue/chat.${metadata.chatId}`;
      this.wsManager.subscribeToReply(replyDestination, (response: WebSocketResponse) => {
        if (response.error) {
          onError(response.error);
        } else if (response.content) {
          onChunk(response.content);
        }
        if (response.isComplete) {
          onComplete();
        }
      }, metadata.chatId);
    }, 'start-chat');

    // Send message
    await this.wsManager.sendMessage(
      JSON.stringify({ prompt: message, responseFormat, schemaJson: schemaJson || null }),
      WEBSOCKET_CONFIG.SEND_START_DESTINATION
    );
  }

  public async sendMessage(
    message: string,
    chatId: string,
    responseFormat: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    schemaJson?: string
  ): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    // Cleanup if switching chats
    if (this.currentChatId && this.currentChatId !== chatId) {
      this.cleanup();
    }
    
    this.currentChatId = chatId;
    const replyDestination = `/user/queue/chat.${chatId}`;
    
    this.wsManager.subscribeToReply(replyDestination, (response: WebSocketResponse) => {
      if (response.error) {
        onError(response.error);
      } else if (response.content) {
        onChunk(response.content);
      }
      if (response.isComplete) {
        onComplete();
      }
    }, chatId);

    await this.wsManager.sendMessage(
      JSON.stringify({ prompt: message, responseFormat, schemaJson: schemaJson || null, chatId }),
      WEBSOCKET_CONFIG.SEND_DESTINATION
    );
  }

  private cleanup(): void {
    if (this.currentChatId) {
      this.wsManager.unsubscribe(`/user/queue/chat.${this.currentChatId}`);
      this.wsManager.clearResponseHandler(this.currentChatId);
    }
    this.wsManager.unsubscribe(WEBSOCKET_CONFIG.RECEIVE_METADATA_DESTINATION);
    this.wsManager.clearResponseHandler('start-chat');
  }

  public abortCurrentStream(chatId?: string): void {
    if (chatId) {
      this.wsManager.unsubscribe(`/user/queue/chat.${chatId}`);
      this.wsManager.clearResponseHandler(chatId);
      if (this.currentChatId === chatId) {
        this.currentChatId = null;
      }
    }
    this.cleanup();
  }

  public disconnect(): void {
    this.cleanup();
    this.currentChatId = null;
    this.wsManager.disconnect();
  }

  public isConnected(): boolean {
    return this.wsManager.isWebSocketConnected();
  }
}
