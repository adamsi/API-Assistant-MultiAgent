import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Auth is now handled in _app.tsx
import { deleteChat, setLastVisitedChatId, fetchChatMessages, addChat, setChatMessages } from '@/store/slices/chatMemorySlice';
import { fetchRootFolder } from '@/store/slices/uploadSlice';
import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Conversation, Message, ChatMessage } from '@/types/chat';
import { ResponseFormat } from '@/types/responseFormat';
import { KeyValuePair } from '@/types/data';
import { ErrorMessage } from '@/types/error';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import ParticlesBackground from '@/components/Global/Particles';
import { useConversations } from '@/hooks/useConversations';
import { useChatStreaming } from '@/hooks/useChatStreaming';

const ChatPage: React.FC = () => {
  const router = useRouter();
  const { chatId } = router.query;
  const dispatch = useAppDispatch();
  const { user, isAdmin } = useAppSelector((state) => state.auth);
  const { chats, chatMessages, lastVisitedChatId } = useAppSelector((state) => state.chatMemory);
  const { rootFolder } = useAppSelector((state) => state.upload);

  // STATE
  const [appLoading, setAppLoading] = useState<boolean>(false);
  const [lightMode, setLightMode] = useState<'dark' | 'light'>('dark');
  const [modelError, setModelError] = useState<ErrorMessage | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation>();
  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // HOOKS
  // Single source of truth: conversations derived from Redux
  const { conversations, loadChats, loadChatMessages: loadChatMessagesFromHook } = useConversations();

  // Load chats on mount if user is authenticated
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  // Fetch uploaded files if user is admin and rootFolder is not loaded
  useEffect(() => {
    if (user && isAdmin && !rootFolder) {
      dispatch(fetchRootFolder());
    }
  }, [dispatch, user, isAdmin, rootFolder]);

  // Track metadata descriptions to preserve them during stream updates
  const metadataDescriptionsRef = useRef<Record<string, string>>({});
  // Track navigation to prevent multiple simultaneous navigations
  const isNavigatingRef = useRef<boolean>(false);
  // Throttle Redux updates during streaming for better performance
  const reduxUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingReduxUpdateRef = useRef<{ chatId: string; messages: ChatMessage[] } | null>(null);

  // Streaming hook
  const { sendMessage, handleStop, messageIsStreaming, stopConversationRef, chatService } = useChatStreaming({
    onStreamUpdate: (conversation) => {
      // Preserve description from metadata if it exists
      if (conversation.chatId && metadataDescriptionsRef.current[conversation.chatId]) {
        conversation = {
          ...conversation,
          name: metadataDescriptionsRef.current[conversation.chatId],
        };
      }
      // Update UI immediately for smooth streaming
      setSelectedConversation(conversation);
      
      // Throttle Redux updates to every 500ms to avoid excessive dispatches
      if (conversation.chatId) {
        const chatMessages: ChatMessage[] = conversation.messages.map(msg => ({
          content: msg.content,
          type: (msg.role === 'user' ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
        }));
        
        pendingReduxUpdateRef.current = { chatId: conversation.chatId, messages: chatMessages };
        
        if (!reduxUpdateTimerRef.current) {
          reduxUpdateTimerRef.current = setTimeout(() => {
            if (pendingReduxUpdateRef.current) {
              dispatch(setChatMessages(pendingReduxUpdateRef.current));
              pendingReduxUpdateRef.current = null;
            }
            reduxUpdateTimerRef.current = null;
          }, 500);
        }
      }
    },
    onStreamComplete: () => {
      // Flush pending Redux update when streaming completes
      if (pendingReduxUpdateRef.current) {
        dispatch(setChatMessages(pendingReduxUpdateRef.current));
        pendingReduxUpdateRef.current = null;
      }
      if (reduxUpdateTimerRef.current) {
        clearTimeout(reduxUpdateTimerRef.current);
        reduxUpdateTimerRef.current = null;
      }
    },
    onMetadata: (metadata) => {
      // Store the metadata description
      metadataDescriptionsRef.current[metadata.chatId] = metadata.description;
      
      setSelectedConversation((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          id: metadata.chatId, // Use chatId as id for stable reference
          chatId: metadata.chatId,
          name: metadata.description,
        };
        // Update Redux
        dispatch(addChat({ chatId: metadata.chatId, description: metadata.description }));
        dispatch(setLastVisitedChatId(metadata.chatId));
        return updated;
      });
    },
  });

  // Auth is now handled in _app.tsx

  // CONNECT WEBSOCKET ON MOUNT (if authenticated)
  useEffect(() => {
    if (user) {
      chatService.setAuthenticated(true);
      chatService.connect();
    } else {
      chatService.setAuthenticated(false);
    }
  }, [user, chatService]);

  // WEBSOCKET CLEANUP
  useEffect(() => {
    const handleLogout = () => {
      chatService.disconnect();
    };
    window.addEventListener('websocket-disconnect', handleLogout);
    return () => {
      window.removeEventListener('websocket-disconnect', handleLogout);
      // Cleanup Redux update timer
      if (reduxUpdateTimerRef.current) {
        clearTimeout(reduxUpdateTimerRef.current);
      }
    };
  }, [chatService]);

  // Reset navigation guard when route changes
  useEffect(() => {
    isNavigatingRef.current = false;
  }, [chatId]);

  // LOAD CONVERSATION FROM CHATID
  useEffect(() => {
    if (!chatId || typeof chatId !== 'string' || !user) return;

    // Try to find conversation in conversations (derived from Redux)
    const conversation = conversations.find((c) => c.chatId === chatId);
    if (conversation) {
      // Ensure messages are loaded
      if (!chatMessages[chatId]) {
        loadChatMessagesFromHook(chatId);
        // Create placeholder conversation with empty messages to show sidebar while loading
        const placeholderConversation: Conversation = {
          ...conversation,
          messages: [],
        };
        if (!selectedConversation || selectedConversation.chatId !== chatId) {
          setSelectedConversation(placeholderConversation);
          dispatch(setLastVisitedChatId(chatId));
        }
        return;
      }
      // Only update if it's different to avoid unnecessary re-renders
      if (!selectedConversation || selectedConversation.chatId !== chatId) {
        setSelectedConversation(conversation);
        dispatch(setLastVisitedChatId(chatId));
      }
      return;
    }

    // If not in conversations, check if chat exists in Redux
    const chat = chats.find((c) => c.chatId === chatId);
    if (!chat) {
      // Wait a bit for chats to load, then redirect if still not found
      const timeout = setTimeout(() => {
        if (chats.length > 0) {
          router.replace('/');
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }

    // Chat exists but conversation not in conversations yet
    // Load messages and create conversation (temporary until conversations updates)
    if (!chatMessages[chatId]) {
      loadChatMessagesFromHook(chatId);
      // Create placeholder conversation with empty messages to show sidebar while loading
      const placeholderConversation: Conversation = {
        id: chat.chatId, // Use chatId as id for stable reference
        chatId: chat.chatId,
        name: chat.description,
        messages: [],
        prompt: DEFAULT_SYSTEM_PROMPT,
        folderId: null,
        responseFormat: ResponseFormat.SIMPLE,
        textDirection: 'ltr',
      };
      if (!selectedConversation || selectedConversation.chatId !== chatId) {
        setSelectedConversation(placeholderConversation);
        dispatch(setLastVisitedChatId(chatId));
      }
      return;
    }

    // Load messages from backend
    const backendMessages: Message[] = (chatMessages[chatId] || []).map(
      (msg) => ({
        role: msg.type === 'USER' ? 'user' : 'assistant',
        content: msg.content,
      })
    );

    // Create conversation from chat and messages
    const tempConversation: Conversation = {
      id: chat.chatId, // Use chatId as id for stable reference
      chatId: chat.chatId,
      name: chat.description,
      messages: backendMessages,
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: null,
      responseFormat: ResponseFormat.SIMPLE,
      textDirection: 'ltr',
    };

    // Only update if it's different to avoid unnecessary re-renders
    if (!selectedConversation || selectedConversation.chatId !== chatId) {
      setSelectedConversation(tempConversation);
      dispatch(setLastVisitedChatId(chatId));
    }
  }, [chatId, chats, chatMessages, conversations, user, router, dispatch, loadChatMessagesFromHook, selectedConversation]);

  // Update selected conversation when messages are loaded (replace placeholder with actual messages)
  useEffect(() => {
    if (!chatId || typeof chatId !== 'string' || !selectedConversation || !chatMessages[chatId]) return;
    
    // If we have a placeholder conversation (empty messages) and messages are now loaded, update it
    if (selectedConversation.chatId === chatId && selectedConversation.messages.length === 0 && chatMessages[chatId].length > 0) {
      // Try to find in conversations first
      const conversation = conversations.find((c) => c.chatId === chatId);
      if (conversation) {
        // Use conversation which already has messages from useConversations hook
        const preservedName = metadataDescriptionsRef.current[chatId] || conversation.name;
        setSelectedConversation({
          ...conversation,
          name: preservedName,
        });
        return;
      }
      
      // If not in conversations, create from chat and messages
      const chat = chats.find((c) => c.chatId === chatId);
      if (chat) {
        const backendMessages: Message[] = chatMessages[chatId].map(
          (msg) => ({
            role: msg.type === 'USER' ? 'user' : 'assistant',
            content: msg.content,
          })
        );
        
        const updatedConversation: Conversation = {
          ...selectedConversation,
          messages: backendMessages,
          name: chat.description,
        };
        setSelectedConversation(updatedConversation);
      }
    }
  }, [chatId, chatMessages, selectedConversation, conversations, chats]);

  // Update selected conversation when conversations update
  // Also preserve metadata descriptions
  useEffect(() => {
    if (selectedConversation?.chatId) {
      const updatedConversation = conversations.find((c) => c.chatId === selectedConversation.chatId);
      if (updatedConversation) {
        // Only update if messages are different or if we need to update the name
        const preservedName = metadataDescriptionsRef.current[selectedConversation.chatId] || updatedConversation.name;
        const needsUpdate = 
          updatedConversation.messages.length !== selectedConversation.messages.length ||
          updatedConversation.name !== preservedName;
        
        if (needsUpdate) {
          setSelectedConversation({
            ...updatedConversation,
            name: preservedName,
          });
        }
      }
    }
  }, [conversations, selectedConversation?.chatId]);

  // HANDLERS
  const handleLightMode = (mode: 'dark' | 'light') => {
    setLightMode(mode);
    localStorage.setItem('theme', mode);
  };

  const handleToggleChatbar = () => {
    setShowSidebar(!showSidebar);
    localStorage.setItem('showChatbar', JSON.stringify(!showSidebar));
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // Prevent multiple simultaneous navigations
    if (isNavigatingRef.current) return;
    
    dispatch(setLastVisitedChatId(conversation.chatId || null));
    
    if (conversation.chatId) {
      // Use replace to avoid adding to history and prevent abort errors
      // Only navigate if we're switching to a different chat
      if (chatId !== conversation.chatId) {
        isNavigatingRef.current = true;
        router.replace(`/chat/${conversation.chatId}`).then(() => {
          isNavigatingRef.current = false;
        }).catch(() => {
          isNavigatingRef.current = false;
        });
      } else {
        // If already on this chat, just update the state
        setSelectedConversation(conversation);
      }
    } else {
      isNavigatingRef.current = true;
      router.replace('/').then(() => {
        isNavigatingRef.current = false;
      }).catch(() => {
        isNavigatingRef.current = false;
      });
    }
  };

  const handleNewConversation = () => {
    dispatch(setLastVisitedChatId(null));
    router.replace('/');
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    if (conversation.chatId) {
      try {
        await dispatch(deleteChat(conversation.chatId)).unwrap();
        if (conversation.chatId === chatId) {
          router.replace('/');
        }
      } catch (error) {
        console.error('Failed to delete chat:', error);
        toast.error('Failed to delete conversation.');
      }
    }
  };

  const handleUpdateConversation = (conversation: Conversation, data: KeyValuePair) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    // Update selected conversation
    setSelectedConversation(updatedConversation);
    // Conversations are managed by Redux, but we can update the selected one locally
    // The Redux state will update when backend syncs
  };

  const handleClearConversations = () => {
    // Conversations are managed by Redux
    // This would need to be handled by clearing Redux state if needed
    // For now, just navigate to home
    router.replace('/');
  };

  const handleEditMessage = (message: Message, messageIndex: number) => {
    if (selectedConversation) {
      const updatedMessages = selectedConversation.messages
        .map((m, i) => (i < messageIndex ? m : undefined))
        .filter((m) => m) as Message[];

      const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages,
      };

      setSelectedConversation(updatedConversation);
      setCurrentMessage(message);
    }
  };

  const handleSend = async (message: Message, deleteCount = 0) => {
    if (!user || !selectedConversation || !selectedConversation.chatId) return;
    await sendMessage(selectedConversation, message, deleteCount);
  };

  // EFFECTS
  useEffect(() => {
    if (currentMessage) {
      handleSend(currentMessage);
      setCurrentMessage(undefined);
    }
  }, [currentMessage]);

  useEffect(() => {
    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }
  }, [selectedConversation]);

  // ON LOAD
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme) {
      setLightMode(theme as 'dark' | 'light');
    }

    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      setShowSidebar(showChatbar === 'true');
    }
  }, []);

  // Create a placeholder conversation if we have a chatId but no conversation yet
  // This allows sidebar to show while messages are loading
  const displayConversation = selectedConversation || (chatId && typeof chatId === 'string' ? {
    id: chatId, // Use chatId as id for stable reference
    chatId: chatId,
    name: '', // Empty name - title will be empty while loading
    messages: [], // Empty messages - chat area will be empty until loaded
    prompt: DEFAULT_SYSTEM_PROMPT,
    folderId: null,
    responseFormat: ResponseFormat.SIMPLE,
    textDirection: 'ltr' as const,
  } : {
    id: 'new',
    name: 'New Conversation',
    messages: [],
    prompt: DEFAULT_SYSTEM_PROMPT,
    folderId: null,
    responseFormat: ResponseFormat.SIMPLE,
    textDirection: 'ltr' as const,
  });

  return (
    <>
      <Head>
        <title>{displayConversation.name ? `Gisma Agent - ${displayConversation.name}` : 'Gisma Agent'}</title>
        <meta name="description" content="AI assistant with gisma knowledge base." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" type="image/png" href="/sa-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/sa-logo.png" />
        <link rel="apple-touch-icon" href="/sa-logo.png" />
      </Head>
      <main
        className={`flex h-screen w-screen flex-col text-sm ${lightMode === 'light' ? 'text-gray-900 bg-gradient-to-br from-gray-50 via-white to-gray-100' : 'dark text-white bg-gradient-to-br from-gray-950 via-slate-950 to-black'} relative`}
      >
        {lightMode === 'dark' && (
          <div className="absolute inset-0 z-0">
            <ParticlesBackground />
          </div>
        )}
        <div className="flex h-full w-full relative z-10">
          {showSidebar ? (
            <div>
              <Chatbar
                loading={appLoading}
                conversations={conversations}
                lightMode={lightMode}
                selectedConversation={displayConversation}
                onNewConversation={handleNewConversation}
                onToggleLightMode={handleLightMode}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onUpdateConversation={handleUpdateConversation}
                onClearConversations={handleClearConversations}
              />
              <button
                className={`fixed top-2.5 left-[270px] z-50 h-7 w-7 sm:top-0.5 sm:left-[270px] sm:h-8 sm:w-8 transition-colors ${
                  lightMode === 'light'
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-white hover:text-gray-300'
                }`}
                onClick={handleToggleChatbar}
              >
                <IconArrowBarLeft />
              </button>
              <div
                onClick={handleToggleChatbar}
                className={`absolute top-0 left-0 z-10 h-full w-full sm:hidden ${
                  lightMode === 'light' ? 'bg-gray-900/30' : 'bg-black/70'
                }`}
              ></div>
            </div>
          ) : (
            <button
              className={`fixed top-2.5 left-4 z-50 h-7 w-7 sm:top-0.5 sm:left-4 sm:h-8 sm:w-8 transition-colors ${
                lightMode === 'light'
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-white hover:text-gray-300'
              }`}
              onClick={handleToggleChatbar}
            >
              <IconArrowBarRight />
            </button>
          )}

          <div className="flex flex-1">
            <Chat
              title=''
              conversation={displayConversation}
              messageIsStreaming={messageIsStreaming}
              modelError={modelError}
              loading={appLoading}
              onSend={handleSend}
              onUpdateConversation={handleUpdateConversation}
              onEditMessage={handleEditMessage}
              stopConversationRef={stopConversationRef}
              onStop={handleStop}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default ChatPage;
