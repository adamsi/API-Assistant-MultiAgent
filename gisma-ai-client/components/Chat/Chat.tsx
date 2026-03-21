import { Conversation, Message } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { ErrorMessage } from '@/types/error';
import { IconArrowDown } from '@tabler/icons-react';
import {
  FC,
  MutableRefObject,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ChatMessage } from './ChatMessage';
import { ErrorMessageDiv } from './ErrorMessageDiv';

interface Props {
  conversation: Conversation;
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  title: string | null;
  loading: boolean;
  onSend: (
    message: Message,
    deleteCount: number,
  ) => void;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  onEditMessage: (message: Message, messageIndex: number) => void;
  stopConversationRef: MutableRefObject<boolean>;
  onStop: () => void;
}

export const Chat: FC<Props> = memo(
  ({
    conversation,
    title,
    messageIsStreaming,
    modelError,
    loading,
    onSend,
    onUpdateConversation,
    onEditMessage,
    stopConversationRef,
    onStop,
  }) => {
    const [currentMessage, setCurrentMessage] = useState<Message>();
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
    const [showScrollDownButton, setShowScrollDownButton] =
      useState<boolean>(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastLayoutChatIdRef = useRef<string | undefined>(undefined);
    const hadMessagesRef = useRef(false);

    const scrollContainerToBottomInstant = useCallback(() => {
      const el = chatContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, []);

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current;
        const bottomTolerance = 30;

        if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
          setAutoScrollEnabled(false);
          setShowScrollDownButton(true);
        } else {
          setAutoScrollEnabled(true);
          setShowScrollDownButton(false);
        }
      }
    };

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'auto',
      });
    };

    // Snap to bottom before first paint when opening/switching a thread or when
    // messages first load — avoids the visible "scroll down" animation.
    useLayoutEffect(() => {
      const container = chatContainerRef.current;
      const id = conversation.chatId ?? '';

      if (!container || conversation.messages.length === 0) {
        if (conversation.messages.length === 0) {
          hadMessagesRef.current = false;
        }
        lastLayoutChatIdRef.current = id;
        return;
      }

      const chatSwitched = lastLayoutChatIdRef.current !== id;
      const messagesAppeared = !hadMessagesRef.current;

      if (chatSwitched) {
        lastLayoutChatIdRef.current = id;
      }
      hadMessagesRef.current = true;

      if (chatSwitched || messagesAppeared) {
        container.scrollTop = container.scrollHeight;
      }
    }, [conversation.chatId, conversation.messages.length]);

    // Follow new content while streaming or when auto-scroll is on (instant).
    useEffect(() => {
      if (!autoScrollEnabled) return;
      if (!chatContainerRef.current || conversation.messages.length === 0) return;

      const run = () => {
        scrollContainerToBottomInstant();
      };

      if (messageIsStreaming) {
        const rafId = requestAnimationFrame(run);
        return () => cancelAnimationFrame(rafId);
      }
      run();
    }, [
      conversation.messages,
      messageIsStreaming,
      autoScrollEnabled,
      scrollContainerToBottomInstant,
    ]);

    useEffect(() => {
      setCurrentMessage(
        conversation.messages[conversation.messages.length - 2],
      );
    }, [conversation.messages]);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry.isIntersecting);
          if (entry.isIntersecting) {
            textareaRef.current?.focus();
          }
        },
        {
          root: null,
          threshold: 0.5,
        },
      );
      const messagesEndElement = messagesEndRef.current;
      if (messagesEndElement) {
        observer.observe(messagesEndElement);
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement);
        }
      };
    }, [messagesEndRef]);

    return (
      <div className="relative flex-1 overflow-hidden bg-transparent">
        {modelError ? (
          <ErrorMessageDiv error={modelError} />
        ) : (
          <>
            <div
              className="max-h-full overflow-x-hidden"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {conversation.messages.length === 0 ? (
                <>
                  <div className="mx-auto flex w-[350px] flex-col space-y-10 pt-12 sm:w-[600px]">
                    <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                      {conversation.chatId ? (
                        // If we have a chatId but no messages, we're loading - show empty
                        ''
                      ) : (
                        title
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center border border-b-neutral-300 bg-neutral-100/50 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654]/50 dark:text-neutral-200">
                    Model: GPT-4.1
                  </div>

                  {conversation.messages.map((message, index) => {
                    const isLastMessage = index === conversation.messages.length - 1;
                    // Don't render empty assistant message if streaming (will show loader instead)
                    if (isLastMessage && messageIsStreaming && message.role === 'assistant' && message.content === '') {
                      return null;
                    }
                    return (
                      <ChatMessage
                        key={index}
                        message={message}
                        messageIndex={index}
                        conversation={conversation}
                        onEditMessage={onEditMessage}
                        isLastMessage={isLastMessage && !messageIsStreaming}
                        onRegenerate={() => {
                          if (currentMessage) {
                            onSend(currentMessage, 2);
                          }
                        }}
                      />
                    );
                  })}

                  {/* Show loading indicator when streaming assistant response */}
                  {/* Show loader if streaming and:
                      - No messages yet, OR
                      - Last message is user (waiting for assistant response), OR  
                      - Last message is assistant but empty (before first chunk arrives) */}
                  {messageIsStreaming && (() => {
                    if (conversation.messages.length === 0) {
                      return <ChatLoader />;
                    }
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    // Show loader if last message is user (waiting for assistant) or empty assistant message
                    if (lastMessage.role === 'user' || (lastMessage.role === 'assistant' && lastMessage.content === '')) {
                      return <ChatLoader />;
                    }
                    // Don't show loader if assistant message has content (it's streaming)
                    return null;
                  })()}

                  <div
                    className="h-[120px] sm:h-[162px] bg-transparent"
                    ref={messagesEndRef}
                  />
                </>
              )}
            </div>

            <ChatInput
              stopConversationRef={stopConversationRef}
              onStop={onStop}
              textareaRef={textareaRef}
              messageIsStreaming={messageIsStreaming}
              conversationIsEmpty={conversation.messages.length === 0}
              conversation={conversation}
              onUpdateConversation={onUpdateConversation}
              onSend={(message) => {
                setCurrentMessage(message);
                onSend(message, 0);
              }}
              onRegenerate={() => {
                if (currentMessage) {
                  onSend(currentMessage, 2);
                }
              }}
            />
          </>
        )}
        {showScrollDownButton && (
          <div className="absolute bottom-0 right-0 mb-4 mr-4 pb-20">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
              onClick={handleScrollDown}
            >
              <IconArrowDown size={18} />
            </button>
          </div>
        )}
      </div>
    );
  },
);
Chat.displayName = 'Chat';
