import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Auth is now handled in _app.tsx
import { deleteChat, addChat, setLastVisitedChatId, setChatMessages } from '@/store/slices/chatMemorySlice';
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
import { useSelectedConversation } from '@/hooks/useSelectedConversation';
import { useChatStreaming } from '@/hooks/useChatStreaming';

const Home: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAdmin, loading: authLoading } = useAppSelector((state) => state.auth);
  const { rootFolder } = useAppSelector((state) => state.upload);
  const { loading: chatsLoading } = useAppSelector((state) => state.chatMemory);

  // STATE
  const [appLoading, setAppLoading] = useState<boolean>(false);
  const [lightMode, setLightMode] = useState<'dark' | 'light'>('dark');
  const [modelError, setModelError] = useState<ErrorMessage | null>(null);
  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // HOOKS
  // Single source of truth: conversations derived from Redux
  const { conversations, loadChats } = useConversations();
  const {
    selectedConversation,
    setSelectedConversation,
    selectConversation,
    startNewConversation,
  } = useSelectedConversation();

  // Update selected conversation when it changes in backend (only if it has a chatId)
  // Don't update if we're on home page and should have a new conversation
  // Also preserve metadata descriptions
  useEffect(() => {
    if (selectedConversation?.chatId && router.pathname !== '/') {
      const updated = conversations.find((c) => c.chatId === selectedConversation.chatId);
      if (updated) {
        // Preserve description from metadata if it exists, otherwise use backend description
        const preservedName = metadataDescriptionsRef.current[selectedConversation.chatId] || updated.name;
        setSelectedConversation({
          ...updated,
          name: preservedName,
        });
      }
    }
  }, [conversations, selectedConversation?.chatId, setSelectedConversation, router.pathname]);

  // Track metadata descriptions to preserve them during stream updates
  const metadataDescriptionsRef = useRef<Record<string, string>>({});
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
        // Update Redux - don't navigate, stay on home page to avoid flush
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
      loadChats();
    } else {
      chatService.setAuthenticated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && isAdmin && !rootFolder) {
      dispatch(fetchRootFolder());
    }
  }, [dispatch, user, isAdmin, rootFolder]);

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
    if (conversation.chatId) {
      router.replace(`/chat/${conversation.chatId}`);
    }
  };

  const handleNewConversation = () => {
    startNewConversation();
    setAppLoading(false);
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    if (conversation.chatId) {
      try {
        await dispatch(deleteChat(conversation.chatId)).unwrap();
        // After deletion, conversations will update from Redux
        // Select the first remaining conversation or start new
        const remainingConversations = conversations.filter((c) => c.chatId !== conversation.chatId);
        if (remainingConversations.length > 0) {
          setSelectedConversation(remainingConversations[remainingConversations.length - 1]);
          dispatch(setLastVisitedChatId(remainingConversations[remainingConversations.length - 1].chatId || null));
        } else {
          startNewConversation();
        }
      } catch (error) {
        console.error('Failed to delete chat:', error);
        toast.error('Failed to delete conversation.');
      }
    } else {
      // For new conversations without chatId, just start a new one
      startNewConversation();
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
    // For now, just start a new conversation
    startNewConversation();
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
    if (!user || !selectedConversation) return;
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

  // Create fallback conversation for rendering while useSelectedConversation initializes
  const displayConversation = selectedConversation || {
    id: 'new',
    name: 'New Conversation',
    messages: [],
    prompt: DEFAULT_SYSTEM_PROMPT,
    folderId: null,
    responseFormat: ResponseFormat.SIMPLE,
    textDirection: 'ltr' as const,
  } as Conversation;

  return (
    <>
      <Head>
        <title>Gisma Agent</title>
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
                chatsLoading={chatsLoading}
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
                title="Gisma Agent"
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

export default Home;
