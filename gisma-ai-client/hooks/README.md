# Chat Conversation Logic - Client Side

This document explains how the conversation logic works on the client side after the refactoring.

## Architecture Overview

The chat application uses a **hook-based architecture** with **Redux for state management**. All conversation data is stored in Redux state, eliminating the need for localStorage (except for UI preferences like theme).

## Key Components

### 1. Redux State (`store/slices/chatMemorySlice.ts`)

The Redux store manages:
- **`chats`**: Array of chat metadata (chatId, description) from the backend
- **`chatMessages`**: Record mapping chatId → messages array
- **`lastVisitedChatId`**: The currently selected chat ID (null for new conversations)
- **`loading`**: Loading state
- **`error`**: Error state

### 2. Custom Hooks

#### `useConversations` (`hooks/useConversations.ts`)

Converts backend chat data to Conversation format for the UI:
- Takes `chats` and `chatMessages` from Redux
- Maps them to `Conversation[]` format
- Provides `loadChats()` and `loadChatMessages(chatId)` functions
- Returns conversations sorted newest first

#### `useSelectedConversation` (`hooks/useSelectedConversation.ts`)

Manages the currently selected conversation:
- Initializes conversation on mount based on:
  1. URL `chatId` parameter (if present)
  2. `lastVisitedChatId` from Redux (if present)
  3. First conversation in list (if available)
  4. New empty conversation (if no conversations exist)
- Provides:
  - `selectedConversation`: Current conversation
  - `setSelectedConversation`: Update current conversation
  - `selectConversation`: Select a conversation (updates Redux and navigates)
  - `startNewConversation`: Create and select a new conversation

#### `useChatStreaming` (`hooks/useChatStreaming.ts`)

Handles WebSocket message streaming:
- Manages streaming state (`messageIsStreaming`)
- Handles new chat creation and existing chat messages
- Updates conversation state as chunks arrive
- Handles stream completion and errors
- Provides `sendMessage()`, `handleStop()`, and streaming state

## Conversation Flow

### Starting a New Conversation

1. User clicks "New Conversation"
2. `startNewConversation()` creates a new `Conversation` object:
   - `id`: Generated UUID
   - `chatId`: `undefined` (will be set when first message is sent)
   - `messages`: Empty array
   - Other default values (model, prompt, etc.)
3. `lastVisitedChatId` is set to `null` in Redux
4. User navigates to `/` (home page)

### Sending First Message (New Chat)

1. User sends a message
2. `useChatStreaming.sendMessage()` is called
3. Since `chatId` is undefined, `startNewChat()` is called via WebSocket
4. As chunks arrive:
   - User message is added to conversation
   - Assistant message is created and updated with each chunk
   - Conversation state is updated in real-time
5. When metadata arrives (from backend):
   - `chatId` and `description` are received
   - Conversation is updated with these values
   - `addChat()` dispatches to Redux to add to chats list
   - `lastVisitedChatId` is set to the new `chatId`
6. Conversation is now a "saved" chat with a `chatId`

### Sending Message to Existing Chat

1. User sends a message to a conversation with a `chatId`
2. `sendMessage()` is called with the conversation
3. `sendMessage()` is called via WebSocket with the `chatId`
4. Chunks arrive and update the conversation state
5. Messages are automatically synced to Redux via `fetchChatMessages`

### Selecting an Existing Conversation

1. User clicks a conversation in the sidebar
2. `selectConversation()` is called
3. `lastVisitedChatId` is updated in Redux
4. If conversation has `chatId`, navigate to `/chat/[chatId]`
5. If no `chatId` (new conversation), navigate to `/`

### Loading Conversations on Page Load

**On `/` (home page):**
1. `useSelectedConversation` hook initializes
2. Checks URL for `chatId` parameter (none for home page)
3. Checks `lastVisitedChatId` from Redux:
   - If `null`: Creates new conversation
   - If set: Finds conversation by `chatId` and selects it
4. If no conversations exist, creates a new one

**On `/chat/[chatId]`:**
1. `useSelectedConversation` hook initializes
2. Finds conversation by `chatId` from URL
3. Loads messages from Redux (`chatMessages[chatId]`)
4. If messages not loaded, dispatches `fetchChatMessages(chatId)`
5. Sets `lastVisitedChatId` to the `chatId`

## State Management

### Redux as Single Source of Truth

- **Backend chats**: Fetched via `fetchAllChats()` and stored in `chats`
- **Messages**: Fetched via `fetchChatMessages(chatId)` and stored in `chatMessages`
- **Last visited**: Stored in `lastVisitedChatId` (replaces localStorage)

### Local Component State

- **UI state**: `selectedConversation`, `conversations` (for sidebar)
- **Streaming state**: Managed by `useChatStreaming`
- **UI preferences**: Theme, sidebar visibility (still in localStorage for persistence)

## Key Differences from Previous Implementation

1. **No localStorage for conversations**: All conversation data is in Redux
2. **Simplified hooks**: Logic extracted from pages into reusable hooks
3. **Cleaner separation**: Each hook has a single responsibility
4. **Better state management**: Redux is the single source of truth
5. **Shorter code**: Pages are much simpler, logic is in hooks

## Benefits

- **Maintainability**: Logic is separated into focused hooks
- **Testability**: Hooks can be tested independently
- **Reusability**: Hooks can be used across different pages
- **Performance**: Redux provides efficient state updates
- **Type safety**: Full TypeScript support throughout

