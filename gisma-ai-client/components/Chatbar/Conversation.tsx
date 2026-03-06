import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import {
  IconCheck,
  IconMessage,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { DragEvent, FC, useState, useRef } from 'react';

interface Props {
  selectedConversation: Conversation;
  conversation: Conversation;
  loading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  lightMode?: 'light' | 'dark';
}

export const ConversationComponent: FC<Props> = ({
  selectedConversation,
  conversation,
  loading,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  lightMode = 'dark',
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const isNavigatingRef = useRef<boolean>(false);

  const handleDragStart = (
    e: DragEvent<HTMLButtonElement>,
    conversation: Conversation,
  ) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('conversation', JSON.stringify(conversation));
    }
  };

  // Use chatId for matching (stable, from backend)
  const isSelected = 
    selectedConversation.chatId && conversation.chatId && 
    selectedConversation.chatId === conversation.chatId;

  return (
    <div className="relative flex items-center">
      <button
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-sm transition-transform duration-apple active:scale-[0.98] ${
          loading ? 'disabled:cursor-not-allowed' : ''
        } ${
          lightMode === 'light'
            ? isSelected
              ? 'bg-gray-100 border border-gray-300 hover:bg-gray-150'
              : 'hover:bg-gray-50'
            : isSelected
            ? 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/5'
            : 'hover:bg-white/5'
        }`}
        onClick={() => {
          // Prevent multiple simultaneous navigations
          if (isNavigatingRef.current || loading) return;
          
          // Call onSelectConversation first to update state
          onSelectConversation(conversation);
          
          if (conversation.chatId) {
            // Use replace to avoid adding to history and prevent abort errors
            isNavigatingRef.current = true;
            router.replace(`/chat/${conversation.chatId}`).then(() => {
              isNavigatingRef.current = false;
            }).catch(() => {
              isNavigatingRef.current = false;
            });
          } else {
            isNavigatingRef.current = true;
            router.replace('/').then(() => {
              isNavigatingRef.current = false;
            }).catch(() => {
              isNavigatingRef.current = false;
            });
          }
        }}
        disabled={loading}
        draggable="true"
        onDragStart={(e) => handleDragStart(e, conversation)}
      >
        <IconMessage size={18} />
        <div
          className={`relative max-h-8 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-xs leading-4 font-medium ${
            isSelected
              ? lightMode === 'light' ? 'pr-12 text-gray-900' : 'pr-12 text-white'
              : lightMode === 'light' ? 'text-gray-700' : 'text-white/80'
          }`}
        >
          {conversation.name}
        </div>
      </button>

      {isDeleting && isSelected && (
        <div className={`absolute right-1 z-10 flex gap-1 ${
          lightMode === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          <button
            className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg transition-all duration-apple active:scale-95 ${
              lightMode === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(conversation);
              setIsDeleting(false);
            }}
          >
            <IconCheck size={18} />
          </button>
          <button
            className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg transition-all duration-apple active:scale-95 ${
              lightMode === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleting(false);
            }}
          >
            <IconX size={18} />
          </button>
        </div>
      )}

      {isSelected && !isDeleting && (
        <div className={`absolute right-1 z-10 flex gap-1 ${
          lightMode === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          <button
            className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg transition-all duration-apple active:scale-95 ${
              lightMode === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleting(true);
            }}
          >
            <IconTrash size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
