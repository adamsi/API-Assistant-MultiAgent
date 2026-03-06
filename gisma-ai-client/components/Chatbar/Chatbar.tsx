import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { IconMessagesOff, IconPlus } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import { Search } from '../Sidebar/Search';
import { ChatbarSettings } from './ChatbarSettings';
import { Conversations } from './Conversations';

interface Props {
  loading: boolean;
  conversations: Conversation[];
  lightMode: 'light' | 'dark';
  selectedConversation: Conversation;
  onNewConversation: () => void;
  onToggleLightMode: (mode: 'light' | 'dark') => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  onClearConversations: () => void;
  chatsLoading?: boolean;
}

export const Chatbar: FC<Props> = ({
  loading,
  conversations,
  lightMode,
  selectedConversation,
  onNewConversation,
  onToggleLightMode,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  onClearConversations,
  chatsLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredConversations, setFilteredConversations] =
    useState<Conversation[]>(conversations);

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    onUpdateConversation(conversation, data);
    setSearchTerm('');
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    onDeleteConversation(conversation);
    setSearchTerm('');
  };


  useEffect(() => {
    if (searchTerm) {
      setFilteredConversations(
        conversations.filter((conversation) => {
          const searchable =
            conversation.name.toLocaleLowerCase() +
            ' ' +
            conversation.messages.map((message) => message.content).join(' ');
          return searchable.toLowerCase().includes(searchTerm.toLowerCase());
        }),
      );
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchTerm, conversations]);

  return (
    <div
      className={`fixed top-0 bottom-0 z-50 flex h-full w-[260px] flex-none flex-col bg-white/5 backdrop-blur-2xl border-r border-white/10 shadow-2xl transition-all duration-apple sm:relative sm:top-0 space-y-3 p-4`}
    >
      <div className="flex items-center">
        <button
          className={`flex w-full flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-xl border backdrop-blur-sm px-4 py-3 text-sm font-medium leading-normal transition-all duration-apple active:scale-[0.98] ${
            lightMode === 'light'
              ? 'border-gray-300 bg-white/90 text-gray-900 hover:bg-white hover:border-gray-400'
              : 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30'
          }`}
          onClick={() => {
            onNewConversation();
            setSearchTerm('');
          }}
        >
          <IconPlus size={18} />
          New chat
        </button>
      </div>

      {conversations.length > 1 && (
        <Search
          placeholder="Search conversations..."
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          lightMode={lightMode}
        />
      )}

      <div className="flex-grow overflow-auto">
        {conversations.length > 0 ? (
          <div className="pt-1 sm:pt-2">
            <Conversations
              loading={loading}
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onUpdateConversation={handleUpdateConversation}
              lightMode={lightMode}
            />
          </div>
        ) : null}
      </div>

      <ChatbarSettings
        lightMode={lightMode}
        conversationsCount={conversations.length}
        selectedConversation={selectedConversation}
        onToggleLightMode={onToggleLightMode}
        onClearConversations={onClearConversations}
      />
    </div>
  );
};
