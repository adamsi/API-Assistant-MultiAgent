import { Message } from '@/types/chat';

const CHAT_MESSAGES_PREFIX = 'chat_messages_';
const LAST_VISITED_CHAT_KEY = 'lastVisitedChatId';

export const saveChatMessages = (chatId: string, messages: Message[]) => {
  if (!chatId) return;
  try {
    localStorage.setItem(
      `${CHAT_MESSAGES_PREFIX}${chatId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error('Failed to save chat messages to localStorage:', error);
  }
};

export const loadChatMessages = (chatId: string): Message[] | null => {
  if (!chatId) return null;
  try {
    const stored = localStorage.getItem(`${CHAT_MESSAGES_PREFIX}${chatId}`);
    if (stored) {
      return JSON.parse(stored) as Message[];
    }
  } catch (error) {
    console.error('Failed to load chat messages from localStorage:', error);
  }
  return null;
};

export const clearChatMessages = (chatId: string) => {
  if (!chatId) return;
  try {
    localStorage.removeItem(`${CHAT_MESSAGES_PREFIX}${chatId}`);
  } catch (error) {
    console.error('Failed to clear chat messages from localStorage:', error);
  }
};

export const saveLastVisitedChat = (chatId: string | null) => {
  try {
    if (chatId) {
      localStorage.setItem(LAST_VISITED_CHAT_KEY, chatId);
    } else {
      localStorage.removeItem(LAST_VISITED_CHAT_KEY);
    }
  } catch (error) {
    console.error('Failed to save last visited chat to localStorage:', error);
  }
};

export const getLastVisitedChat = (): string | null => {
  try {
    return localStorage.getItem(LAST_VISITED_CHAT_KEY);
  } catch (error) {
    console.error('Failed to load last visited chat from localStorage:', error);
    return null;
  }
};

