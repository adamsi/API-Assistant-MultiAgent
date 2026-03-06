import { useRef, useState, useCallback } from 'react';
import { Conversation, Message } from '@/types/chat';
import { ChatService } from '@/utils/websocket/chatService';
import { WEBSOCKET_CONFIG } from '@/utils/websocket/config';
import toast from 'react-hot-toast';

interface UseChatStreamingOptions {
  onStreamUpdate: (conversation: Conversation) => void;
  onMetadata?: (metadata: { chatId: string; description: string }) => void;
  onStreamComplete?: () => void;
}

/**
 * Custom hook to handle chat message streaming via WebSocket
 * Manages streaming state and WebSocket communication
 */
export const useChatStreaming = (options: UseChatStreamingOptions) => {
  const { onStreamUpdate, onMetadata, onStreamComplete } = options;
  const [messageIsStreaming, setMessageIsStreaming] = useState(false);
  const stopConversationRef = useRef<boolean>(false);
  const finalizeStreamRef = useRef<(() => void) | null>(null);
  const chatService = useRef<ChatService>(ChatService.getInstance(WEBSOCKET_CONFIG.SERVER_URL));
  const currentConversationRef = useRef<Conversation | null>(null);

  const handleStop = useCallback(() => {
    stopConversationRef.current = true;
    if (finalizeStreamRef.current) {
      finalizeStreamRef.current();
    } else {
      setMessageIsStreaming(false);
    }
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  }, []);

  const sendMessage = useCallback(
    async (
      conversation: Conversation,
      message: Message,
      deleteCount = 0
    ) => {
      if (!conversation) return;

      // Update conversation with user message
      const updatedMessages = deleteCount
        ? [...conversation.messages.slice(0, -deleteCount), message]
        : [...conversation.messages, message];

      const updatedConversation: Conversation = {
        ...conversation,
        messages: updatedMessages,
      };

      currentConversationRef.current = updatedConversation;
      onStreamUpdate(updatedConversation);
      setMessageIsStreaming(true);

      let assistantMessage: Message = { role: 'assistant', content: '' };
      let isFirstChunk = true;
      let completionTimer: any = null;
      let receivedChatId: string | undefined = updatedConversation.chatId;

      const finalizeStream = () => {
        if (completionTimer) {
          clearTimeout(completionTimer);
          completionTimer = null;
        }

        setMessageIsStreaming(false);

        if (currentConversationRef.current) {
          const finalConversation = {
            ...currentConversationRef.current,
            chatId: receivedChatId,
          };
          currentConversationRef.current = finalConversation;
          onStreamUpdate(finalConversation);
        }

        // Call onStreamComplete callback if provided
        if (onStreamComplete) {
          onStreamComplete();
        }

        finalizeStreamRef.current = null;
      };

      finalizeStreamRef.current = finalizeStream;

      try {
        const isNewConversation = !updatedConversation.chatId && updatedConversation.messages.length === 1;

        const streamHandler = (chunk: string) => {
          if (stopConversationRef.current || !currentConversationRef.current) {
            chatService.current.abortCurrentStream(updatedConversation.chatId);
            finalizeStream();
            return;
          }

          // Clear any existing completion timer - we're still receiving chunks
          if (completionTimer) clearTimeout(completionTimer);
          // Set a timeout as fallback for dead connections (500ms)
          // The actual completion will come immediately from WebSocket onComplete callback when isComplete is true
          completionTimer = setTimeout(() => {
            finalizeStream();
          }, 500);

          let updated: Conversation;
          if (isFirstChunk) {
            isFirstChunk = false;
            assistantMessage = { role: 'assistant', content: chunk };
            updated = {
              ...currentConversationRef.current,
              messages: [...currentConversationRef.current.messages, assistantMessage],
            };
          } else {
            assistantMessage.content += chunk;
            updated = {
              ...currentConversationRef.current,
              messages: currentConversationRef.current.messages.map((msg, index) =>
                index === currentConversationRef.current!.messages.length - 1 ? assistantMessage : msg
              ),
            };
          }

          currentConversationRef.current = updated;
          // Update immediately for smooth streaming
          onStreamUpdate(updated);
        };

        if (isNewConversation) {
          await chatService.current.startNewChat(
            message.content,
            updatedConversation.responseFormat,
            streamHandler,
            () => {
              // Clear completion timer since stream is complete
              if (completionTimer) {
                clearTimeout(completionTimer);
                completionTimer = null;
              }
              // Immediately finalize when WebSocket signals completion
              finalizeStream();
            },
            (error: string) => {
              console.error('WebSocket error:', error);
              toast.error('Connection error. Please try again.');
              setMessageIsStreaming(false);
            },
            (metadata) => {
              receivedChatId = metadata.chatId;
              if (onMetadata) {
                onMetadata(metadata);
              }
            },
            updatedConversation.schemaJson
          );
        } else {
          if (!updatedConversation.chatId) {
            toast.error('Chat ID is missing.');
            setMessageIsStreaming(false);
            return;
          }

          await chatService.current.sendMessage(
            message.content,
            updatedConversation.chatId,
            updatedConversation.responseFormat,
            streamHandler,
            () => {
              // Clear completion timer since stream is complete
              if (completionTimer) {
                clearTimeout(completionTimer);
                completionTimer = null;
              }
              // Immediately finalize when WebSocket signals completion
              finalizeStream();
            },
            (error: string) => {
              console.error('WebSocket error:', error);
              toast.error('Connection error. Please try again.');
              setMessageIsStreaming(false);
            },
            updatedConversation.schemaJson
          );
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message. Please try again.');
        setMessageIsStreaming(false);
      }
    },
    [onStreamUpdate, onMetadata]
  );

  return {
    sendMessage,
    handleStop,
    messageIsStreaming,
    stopConversationRef,
    chatService: chatService.current,
  };
};
