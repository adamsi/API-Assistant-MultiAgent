import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setLastVisitedChatId } from '@/store/slices/chatMemorySlice';
import { Conversation } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { ResponseFormat } from '@/types/responseFormat';
import { useConversations } from './useConversations';

/**
 * Custom hook to manage the currently selected conversation
 * Handles selection, creation, and restoration logic
 */
export const useSelectedConversation = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { lastVisitedChatId } = useAppSelector((state) => state.chatMemory);
  const { conversations, loadChatMessages } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | undefined>();
  const initializedRef = useRef(false);

  // Create new conversation
  const createNewConversation = useCallback((): Conversation => {
    return {
      id: 'new', // Temporary id for new conversations
      name: 'New Conversation',
      messages: [],
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: null,
      responseFormat: ResponseFormat.SIMPLE,
      textDirection: 'ltr',
    };
  }, []);

  // Select conversation by chatId or conversation object
  const selectConversation = useCallback(
    (conversation: Conversation) => {
      setSelectedConversation(conversation);
      dispatch(setLastVisitedChatId(conversation.chatId || null));
      
      if (conversation.chatId) {
        loadChatMessages(conversation.chatId);
      }
    },
    [dispatch, loadChatMessages]
  );

  // Initialize conversation on mount (only once)
  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    // If we have a chatId in URL, use that (for /chat/[chatId] route)
    const chatId = router.query.chatId as string | undefined;
    if (chatId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.chatId === chatId);
      if (conversation) {
        setSelectedConversation(conversation);
        dispatch(setLastVisitedChatId(chatId));
        loadChatMessages(chatId);
        return;
      }
    }

    // On home page (/), always create a new conversation
    // Don't restore from lastVisitedChatId on home page
    if (!chatId) {
      const newConv = createNewConversation();
      setSelectedConversation(newConv);
      dispatch(setLastVisitedChatId(null));
      return;
    }

    // If chatId in URL but conversation not found yet, wait for conversations to load
    // This will be handled by the second useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle route changes and update selected conversation
  useEffect(() => {
    if (!user || initializedRef.current === false) return;

    const chatId = router.query.chatId as string | undefined;

    // If we're on home page (/), ensure we have a new conversation (no chatId)
    if (!chatId) {
      // Only create new conversation if:
      // 1. No conversation selected, OR
      // 2. Current conversation has chatId but no messages (user navigated away and back)
      // Don't replace if conversation has messages (user is actively chatting)
      if (!selectedConversation) {
        const newConv = createNewConversation();
        setSelectedConversation(newConv);
        dispatch(setLastVisitedChatId(null));
      } else if (selectedConversation.chatId && selectedConversation.messages.length === 0) {
        // Only replace if it's an empty conversation with chatId (likely from navigation)
        const newConv = createNewConversation();
        setSelectedConversation(newConv);
        dispatch(setLastVisitedChatId(null));
      }
      return;
    }

    // If we have a chatId in URL, try to find it
    if (chatId) {
      if (conversations.length > 0) {
        const conversation = conversations.find((c) => c.chatId === chatId);
        if (conversation) {
          // Only update if it's different from current
          if (!selectedConversation || selectedConversation.chatId !== chatId) {
            setSelectedConversation(conversation);
            dispatch(setLastVisitedChatId(chatId));
            loadChatMessages(chatId);
          } else {
            // Update messages if conversation exists but messages changed
            if (conversation.messages.length !== selectedConversation.messages.length) {
              setSelectedConversation(conversation);
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, user, router.query.chatId, router.pathname]);

  const startNewConversation = useCallback(() => {
    const newConv = createNewConversation();
    setSelectedConversation(newConv);
    dispatch(setLastVisitedChatId(null));
    router.push('/');
  }, [createNewConversation, dispatch, router]);

  return {
    selectedConversation,
    setSelectedConversation,
    selectConversation,
    startNewConversation,
  };
};
