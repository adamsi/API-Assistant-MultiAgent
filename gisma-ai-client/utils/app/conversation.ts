import { Conversation } from '@/types/chat';

/**
 * Update a conversation in the conversations list
 * Returns updated single conversation and all conversations
 */
export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  const updatedConversations = allConversations.map((c) => {
    // Use chatId for matching (stable, from backend)
    if (c.chatId && updatedConversation.chatId && c.chatId === updatedConversation.chatId) {
      return updatedConversation;
    }
    return c;
  });

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};
