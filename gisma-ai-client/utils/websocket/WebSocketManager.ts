import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WebSocketConfig, WebSocketResponse } from '../../types/websocket';
import { WEBSOCKET_CONFIG } from './config';

/**
 * Simple WebSocket Manager - Always connected, auto-reconnects
 */
export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private client: Client | null = null;
  private config: WebSocketConfig;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, any> = new Map();
  private callbacks: Map<string, (response: WebSocketResponse) => void> = new Map();
  private metadataCallbacks: Map<string, (response: any) => void> = new Map();

  private constructor(config: WebSocketConfig) {
    this.config = config;
    this.setupVisibilityHandler();
  }

  public static getInstance(config?: WebSocketConfig): WebSocketManager {
    if (!WebSocketManager.instance) {
      if (!config) {
        throw new Error('WebSocketManager: Config required for first initialization');
      }
      WebSocketManager.instance = new WebSocketManager(config);
    }
    return WebSocketManager.instance;
  }

  private setupVisibilityHandler(): void {
    if (typeof window === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected) {
        this.connect();
      }
    });
  }

  private createClient(): Client {
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(`${this.config.serverUrl}${WEBSOCKET_CONFIG.WS_ENDPOINT}`, null, {
          withCredentials: true
        });
      },
      debug: () => {},
      reconnectDelay: 0, // Manual reconnection
      heartbeatIncoming: WEBSOCKET_CONFIG.HEARTBEAT_INCOMING,
      heartbeatOutgoing: WEBSOCKET_CONFIG.HEARTBEAT_OUTGOING,
    });

    client.onConnect = () => {
      this.isConnected = true;
      console.log('WebSocket: Connected');
    };

    client.onStompError = (frame) => {
      console.error('WebSocket STOMP Error:', frame.headers['message']);
      this.handleDisconnect();
    };

    client.onWebSocketError = (error) => {
      if (this.isConnected) {
        console.error('WebSocket Error:', error);
        this.handleDisconnect();
      }
    };

    client.onDisconnect = () => {
      this.handleDisconnect();
    };

    return client;
  }

  private handleDisconnect(): void {
    if (!this.isConnected) return;
    this.isConnected = false;
    this.subscriptions.clear();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    const delay = 3000; // Simple: 3s delay
    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected) this.connect();
    }, delay);
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client?.active) return;

    if (!this.client) {
      this.client = this.createClient();
    }

    if (!this.client.active) {
      this.client.activate();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.subscriptions.forEach(sub => {
      try { sub.unsubscribe(); } catch {}
    });
    this.subscriptions.clear();
    this.callbacks.clear();
    this.metadataCallbacks.clear();

    if (this.client?.active) {
      this.client.deactivate();
    }

    this.isConnected = false;
  }

  public subscribeToReply(
    destination: string,
    onResponse: (response: WebSocketResponse) => void,
    callbackKey: string
  ): void {
    this.callbacks.set(callbackKey, onResponse);
    
    if (!this.isConnected || !this.client) {
      this.connect().then(() => this.setupSubscription(destination, callbackKey));
      return;
    }

    this.setupSubscription(destination, callbackKey);
  }

  private setupSubscription(destination: string, callbackKey: string): void {
    if (!this.client || !this.isConnected) return;

    // Remove old subscription
    const existing = this.subscriptions.get(destination);
    if (existing) {
      try { existing.unsubscribe(); } catch {}
    }

    const subscription = this.client.subscribe(destination, (message) => {
      const callback = this.callbacks.get(callbackKey);
      if (callback) {
        const isComplete = !message.body || message.body.trim() === '' || message.body === '[DONE]';
        callback({ 
          type: 'response', 
          content: message.body || '', 
          isComplete 
        });
      }
    });

    this.subscriptions.set(destination, subscription);
  }

  public subscribeToMetadata(
    onMetadata: (response: any) => void,
    callbackKey: string
  ): void {
    this.metadataCallbacks.set(callbackKey, onMetadata);
    
    if (!this.isConnected || !this.client) {
      this.connect().then(() => this.setupMetadataSubscription(callbackKey));
      return;
    }

    this.setupMetadataSubscription(callbackKey);
  }

  private setupMetadataSubscription(callbackKey: string): void {
    if (!this.client || !this.isConnected) return;

    const destination = WEBSOCKET_CONFIG.RECEIVE_METADATA_DESTINATION;
    const existing = this.subscriptions.get(destination);
    if (existing) {
      try { existing.unsubscribe(); } catch {}
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const metadata = JSON.parse(message.body);
        const callback = this.metadataCallbacks.get(callbackKey);
        if (callback) callback(metadata);
      } catch (error) {
        console.error('WebSocket: Error parsing metadata:', error);
      }
    });

    this.subscriptions.set(destination, subscription);
  }

  public async sendMessage(
    message: string, 
    destination: string = WEBSOCKET_CONFIG.SEND_DESTINATION
  ): Promise<void> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket: Not connected');
    }

    this.client.publish({ destination, body: message });
  }

  public unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(destination);
      } catch {}
    }
  }

  public clearResponseHandler(callbackKey: string): void {
    this.callbacks.delete(callbackKey);
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected && this.client?.active === true;
  }
}
