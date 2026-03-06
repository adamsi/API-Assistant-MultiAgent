import { useMemo, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchAllChats, fetchChatMessages } from '@/store/slices/chatMemorySlice';
import { Conversation, Message, ChatMessage } from '@/types/chat';
import { ResponseFormat } from '@/types/responseFormat';

/**
 * Custom hook to manage conversations from Redux state
 * Converts backend chats to Conversation format for UI
 * Uses chatId as the stable identifier (no UUID generation)
 */
export const useConversations = () => {
  const dispatch = useAppDispatch();
  const { chats, chatMessages } = useAppSelector((state) => state.chatMemory);

  // Derived from Redux: chats + chatMessages
  // Conversations persist across navigation because Redux state persists
  const conversations = useMemo<Conversation[]>(() => {
    if (!chats || chats.length === 0) return [];

    return chats
      .map((chat) => {
        const messages: Message[] = (chatMessages[chat.chatId] || []).map(
          (msg: ChatMessage) => ({
            role: msg.type === 'USER' ? 'user' : 'assistant',
            content: msg.content,
          })
        );

        return {
          id: chat.chatId, // Use chatId as id for stable reference
          chatId: chat.chatId,
          name: chat.description,
          messages,
          prompt: '',
          responseFormat: ResponseFormat.SIMPLE,
          textDirection: 'ltr' as const,
        };
      })
      .reverse(); // Newest first
  }, [chats, chatMessages]);

  const loadChats = useCallback(() => {
    dispatch(fetchAllChats());
  }, [dispatch]);

  const loadingChatIdsRef = useRef<Set<string>>(new Set());
  
  const loadChatMessages = useCallback((chatId: string) => {
    // Don't load if already loaded
    if (chatMessages[chatId]) {
      return;
    }
    // Don't load if currently loading
    if (loadingChatIdsRef.current.has(chatId)) {
      return;
    }
    loadingChatIdsRef.current.add(chatId);
    dispatch(fetchChatMessages(chatId)).then(() => {
      loadingChatIdsRef.current.delete(chatId);
    }).catch(() => {
      loadingChatIdsRef.current.delete(chatId);
    });
  }, [dispatch, chatMessages]);

  return {
    conversations,
    loadChats,
    loadChatMessages,
  };
};

