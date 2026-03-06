import { IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { SidebarButton } from '../Sidebar/SidebarButton';

interface Props {
  onClearConversations: () => void;
  lightMode?: 'light' | 'dark';
}

export const ClearConversations: FC<Props> = ({ onClearConversations, lightMode = 'dark' }) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);


  const handleClearConversations = () => {
    onClearConversations();
    setIsConfirming(false);
  };

  return isConfirming ? (
    <div className={`flex w-full cursor-pointer items-center gap-3 rounded-xl py-2.5 px-3 backdrop-blur-sm border transition-all duration-apple ${
      lightMode === 'light'
        ? 'bg-white/90 border-gray-300 hover:bg-white'
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}>
      <IconTrash size={18} />

      <div className={`flex-1 text-left text-sm font-medium ${
        lightMode === 'light' ? 'text-gray-900' : 'text-white'
      }`}>
        Are you sure?
      </div>

      <div className="flex gap-1">
        <button
          className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg transition-all duration-apple active:scale-95 ${
            lightMode === 'light'
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleClearConversations();
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
            setIsConfirming(false);
          }}
        >
          <IconX size={18} />
        </button>
      </div>
    </div>
  ) : (
    <SidebarButton
      text='Clear conversations'
      icon={<IconTrash size={18} />}
      onClick={() => setIsConfirming(true)}
      lightMode={lightMode}
    />
  );
};
