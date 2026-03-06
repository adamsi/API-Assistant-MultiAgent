// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  // Change this to your backend server URL
  SERVER_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8080',
  
  // WebSocket endpoint path (will be appended to SERVER_URL)
  WS_ENDPOINT: '/ws',
  
  // STOMP configuration
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  HEARTBEAT_INCOMING: 4000,
  HEARTBEAT_OUTGOING: 4000,
  
  // Connection timeout (in milliseconds)
  CONNECTION_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_WEBSOCKET_TIMEOUT || '15000'), // 15 seconds default
  
  // Message destinations
  SEND_DESTINATION: '/app/chat',
  SEND_START_DESTINATION: '/app/chat/start',
  RECEIVE_DESTINATION: '/user/queue/reply',
  RECEIVE_METADATA_DESTINATION: '/user/queue/metadata',
} as const;
