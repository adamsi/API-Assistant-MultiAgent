# WebSocket Chat Implementation

This directory contains a robust, production-ready WebSocket implementation for real-time chat communication with the backend.

## Architecture

### Singleton Pattern
- **WebSocketManager** uses a singleton pattern to ensure only one WebSocket connection exists across the entire application
- All `ChatService` instances share the same underlying connection
- Connection persists across page navigation and component unmounts

### Persistent Connection
- Connection is established automatically on first use
- Connection stays alive and reconnects automatically on failures
- No manual connection/disconnection needed in components

### Automatic Reconnection
- Exponential backoff: 3s, 6s, 12s, 24s, max 30s
- Infinite retry attempts (never gives up)
- Reconnects automatically when tab becomes visible (Visibility API)
- Handles network interruptions gracefully

## Files

- `WebSocketManager.ts` - Core WebSocket manager using STOMP.js and SockJS (Singleton)
- `chatService.ts` - High-level chat service with simple API
- `config.ts` - Configuration constants for WebSocket settings

## Usage

### Basic Usage

```typescript
import { ChatService } from '@/utils/websocket/chatService';
import { WEBSOCKET_CONFIG } from '@/utils/websocket/config';

// Create service instance (can create multiple, they share the same connection)
const chatService = new ChatService(WEBSOCKET_CONFIG.SERVER_URL);

// Set authentication state
chatService.setAuthenticated(true);

// Send a message to existing chat
await chatService.sendMessage(
  message,
  chatId,
  responseFormat,
  (chunk) => console.log('Received chunk:', chunk),
  () => console.log('Stream complete'),
  (error) => console.error('Error:', error),
  schemaJson
);

// Start a new chat
await chatService.startNewChat(
  message,
  responseFormat,
  (chunk) => console.log('Received chunk:', chunk),
  () => console.log('Stream complete'),
  (error) => console.error('Error:', error),
  (metadata) => console.log('Chat created:', metadata.chatId),
  schemaJson
);

// Abort current stream (optional: pass chatId to abort specific chat)
chatService.abortCurrentStream(chatId);
```

### In React Components

```typescript
const chatService = useRef<ChatService>(
  new ChatService(WEBSOCKET_CONFIG.SERVER_URL)
).current;

useEffect(() => {
  chatService.setAuthenticated(!!user);
}, [user]);

// Connection is automatic - no need to call connect()
// Disconnection only happens on logout
```

## Key Features

### ✅ Never Disconnects
- Connection persists across page navigation
- Only disconnects on explicit logout
- Automatic reconnection on any failure

### ✅ Simple API
- No manual connection management
- Automatic subscription handling
- Clean error handling

### ✅ Robust Reconnection
- Exponential backoff strategy
- Infinite retry attempts
- Visibility API integration
- Connection health monitoring

### ✅ Best Practices
- Singleton pattern prevents multiple connections
- Automatic cleanup of old subscriptions
- Type-safe with TypeScript
- Proper error handling and logging

## Configuration

Update the server URL in `config.ts` or set the environment variable:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=http://your-backend-server:8080
NEXT_PUBLIC_WEBSOCKET_TIMEOUT=15000  # Connection timeout in ms
```

## Backend Requirements

Your Spring Boot backend should have:

1. **STOMP WebSocket configuration** with SockJS support
2. **Message mapping** for `/app/chat` and `/app/chat/start` endpoints
3. **User-specific response queue** `/user/queue/chat.{chatId}`
4. **Metadata queue** `/user/queue/metadata` for new chat creation
5. **Authentication support** - WebSocket connections include cookies for authentication

Example backend controller:
```java
@MessageMapping("/chat")
public Mono<Void> handlePrompt(@Payload String prompt, Principal user) {
    return agentOrchestrator.handleQuery(prompt)
            .doOnNext(response ->
                    messagingTemplate.convertAndSendToUser(
                            user.getName(), "/queue/chat." + chatId, response
                    )
            )
            .then();
}

@MessageMapping("/chat/start")
public Mono<Void> handleNewChat(@Payload String prompt, Principal user) {
    // Create chat and send metadata first
    ChatMetadata metadata = createChat(prompt);
    messagingTemplate.convertAndSendToUser(
            user.getName(), "/queue/metadata", metadata
    );
    // Then send responses to chat-specific queue
    return agentOrchestrator.handleQuery(prompt)
            .doOnNext(response ->
                    messagingTemplate.convertAndSendToUser(
                            user.getName(), "/queue/chat." + metadata.chatId, response
                    )
            )
            .then();
}
```

## Authentication

The WebSocket implementation supports cookie-based authentication (default):

- Uses HTTP-only cookies with `withCredentials: true`
- Authentication is handled automatically via cookies
- No manual token management needed

## How It Works

### Connection Flow
1. First `sendMessage()` or `startNewChat()` call triggers connection
2. Connection is established and stays alive
3. Subsequent calls reuse the same connection
4. Connection reconnects automatically on any failure

### Message Flow
1. **New Chat:**
   - Subscribe to `/user/queue/metadata`
   - Send message to `/app/chat/start`
   - Receive metadata with `chatId`
   - Subscribe to `/user/queue/chat.{chatId}`
   - Receive streaming responses

2. **Existing Chat:**
   - Subscribe to `/user/queue/chat.{chatId}`
   - Send message to `/app/chat`
   - Receive streaming responses

### Reconnection Flow
1. Connection failure detected
2. Wait with exponential backoff
3. Attempt reconnection
4. Resubscribe to active subscriptions
5. Continue seamlessly

## Troubleshooting

### Connection Issues
- Check backend is running and accessible
- Verify `NEXT_PUBLIC_WEBSOCKET_URL` is correct
- Check browser console for connection errors
- Ensure cookies are enabled for authentication

### Message Not Received
- Verify subscription is active (check browser DevTools → Network → WS)
- Check backend is sending to correct queue path
- Ensure `chatId` matches between frontend and backend

### Multiple Connections
- Should not happen with singleton pattern
- Check if multiple `WebSocketManager.getInstance()` calls with different configs
- Ensure all `ChatService` instances use same server URL