import { Conversation, Message } from '@/types/chat';
import { IconCheck, IconCopy, IconUser, IconRobot, IconRepeat } from '@tabler/icons-react';
import { FC, memo, useState } from 'react';

interface Props {
  message: Message;
  messageIndex: number;
  conversation: Conversation;
  onEditMessage: (message: Message, messageIndex: number) => void;
  isLastMessage?: boolean;
  onRegenerate?: () => void;
}

export const ChatMessage: FC<Props> = memo(
  ({ message, messageIndex, conversation, onEditMessage, isLastMessage, onRegenerate }) => {
    const [messagedCopied, setMessageCopied] = useState(false);

    const copyOnClick = () => {
      if (!navigator.clipboard) return;

      navigator.clipboard.writeText(message.content).then(() => {
        setMessageCopied(true);
        setTimeout(() => {
          setMessageCopied(false);
        }, 2000);
      });
    };

    const textDirection = conversation.textDirection || 'ltr';

    return (
      <div
        className={`group px-4 ${
          message.role === 'assistant'
            ? 'border-b border-black/10 bg-gray-50/50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654]/50 dark:text-gray-100'
            : 'border-b border-black/10 bg-white/50 text-gray-800 dark:border-gray-900/50 dark:bg-[#343541]/50 dark:text-gray-100'
        }`}
        style={{ overflowWrap: 'anywhere', direction: textDirection }}
      >
        <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
          <div className="min-w-[40px] text-right font-bold">
            {message.role === 'assistant' ? <IconRobot size={30}/> : <IconUser size={30}/>}
          </div>

          <div className="prose mt-[-2px] w-full dark:prose-invert">
            {message.role === 'user' ? (
              <div className="flex w-full">
                <div 
                  className="prose whitespace-pre-wrap dark:prose-invert"
                  style={{ direction: textDirection }}
                >
                  {message.content}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`absolute ${
                    window.innerWidth < 640
                      ? 'right-3 bottom-1'
                      : 'right-0 top-[26px] m-0'
                  } flex flex-col gap-1`}
                >
                  {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500 dark:text-green-400"
                    />
                  ) : (
                    <button
                      className="translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={copyOnClick}
                    >
                      <IconCopy size={20} />
                    </button>
                  )}
                  {isLastMessage && onRegenerate && (
                    <button
                      className="translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={onRegenerate}
                    >
                      <IconRepeat size={20} />
                    </button>
                  )}
                </div>

                <div 
                  className="prose whitespace-pre-wrap dark:prose-invert"
                  style={{ direction: textDirection }}
                >
                  {message.content}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
);
ChatMessage.displayName = 'ChatMessage';
