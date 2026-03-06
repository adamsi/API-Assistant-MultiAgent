# WebSocket Connection - Simple Explanation

## How It Works (Simple)

### 1. **Connection Flow**

```
User opens chat page
  ↓
ChatService connects to WebSocket (on mount)
  ↓
WebSocket stays connected (always on)
  ↓
User sends message
  ↓
Message sent via WebSocket
  ↓
Response streams back in real-time
```

### 2. **Architecture (3 Layers)**

```
┌─────────────────────────────────┐
│   React Components (UI)         │
│   - Chat pages                   │
│   - useChatStreaming hook        │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   ChatService (Singleton)       │
│   - startNewChat()               │
│   - sendMessage()                │
│   - Manages chat subscriptions   │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   WebSocketManager (Singleton)  │
│   - connect()                    │
│   - sendMessage()                │
│   - subscribe()                 │
│   - Auto-reconnect              │
└─────────────────────────────────┘
```

### 3. **Key Components**

#### **WebSocketManager** (Low-level)
- **What it does**: Manages the actual WebSocket connection
- **Key features**:
  - Always connected (connects on mount)
  - Auto-reconnects if connection drops
  - Handles subscriptions to message queues
  - Sends/receives messages

#### **ChatService** (High-level)
- **What it does**: Provides simple chat API
- **Key features**:
  - Singleton (one instance for entire app)
  - `startNewChat()` - Start new conversation
  - `sendMessage()` - Send to existing chat
  - Manages subscriptions per chat

#### **useChatStreaming Hook** (React Integration)
- **What it does**: Connects React UI to WebSocket
- **Key features**:
  - Handles streaming message updates
  - Updates UI in real-time
  - Manages conversation state

### 4. **Message Flow Example**

#### Starting a New Chat:
```
1. User types message and hits send
2. ChatService.startNewChat() called
3. Subscribe to metadata queue: /user/queue/metadata
4. Send message to: /app/chat/start
5. Backend responds with metadata (chatId, description)
6. Subscribe to chat queue: /user/queue/chat.{chatId}
7. Backend streams response chunks
8. Each chunk updates UI in real-time
9. Stream completes when done
```

#### Sending to Existing Chat:
```
1. User types message and hits send
2. ChatService.sendMessage(chatId) called
3. Subscribe to chat queue: /user/queue/chat.{chatId}
4. Send message to: /app/chat (with chatId)
5. Backend streams response chunks
6. Each chunk updates UI in real-time
7. Stream completes when done
```

### 5. **Connection Management**

#### **Always Connected**
- WebSocket connects when chat page mounts
- Stays connected while user is on chat pages
- Auto-reconnects if connection drops
- Reconnects when tab becomes visible

#### **Disconnection**
- Disconnects when user logs out
- Disconnects when leaving chat pages (optional)

### 6. **Subscriptions**

Each chat has its own subscription:
- **New chat**: `/user/queue/metadata` → then `/user/queue/chat.{chatId}`
- **Existing chat**: `/user/queue/chat.{chatId}`

When switching chats, old subscriptions are cleaned up automatically.

### 7. **Error Handling**

- **Connection errors**: Auto-reconnect with exponential backoff
- **STOMP errors**: Logged, connection resets
- **Message errors**: Passed to error callback

### 8. **Best Practices Used**

✅ **Singleton Pattern** - One connection, one service instance
✅ **Always Connected** - Connect on mount, not on first use
✅ **Auto-Reconnect** - Never give up, always try to reconnect
✅ **Clean Subscriptions** - Clean up when switching chats
✅ **Cookie Auth** - Uses `withCredentials: true` for authentication
✅ **Simple API** - Easy to use, hides complexity

### 9. **Code Locations**

- **WebSocketManager**: `utils/websocket/WebSocketManager.ts`
- **ChatService**: `utils/websocket/chatService.ts`
- **React Hook**: `hooks/useChatStreaming.ts`
- **Connection on Mount**: `pages/index.tsx`, `pages/chat/[chatId].tsx`

### 10. **Configuration**

All settings in: `utils/websocket/config.ts`
- Server URL
- Endpoints
- Heartbeat intervals
- Timeouts

---

## Summary

**Simple Version:**
1. WebSocket connects when you open chat page
2. Stays connected (always on)
3. Send message → Get streaming response
4. Auto-reconnects if connection drops
5. That's it! 🎉

