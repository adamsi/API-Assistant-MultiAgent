import { IconMoon, IconSun, IconUser, IconLogout, IconUpload, IconShield } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { SidebarButton } from '../Sidebar/SidebarButton';
import { ClearConversations } from './ClearConversations';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { clearAllChats, setLastVisitedChatId } from '@/store/slices/chatMemorySlice';
import { useRouter } from 'next/router';
import { Conversation } from '@/types/chat';

interface Props {
  lightMode: 'light' | 'dark';
  conversationsCount: number;
  selectedConversation?: Conversation;
  onToggleLightMode: (mode: 'light' | 'dark') => void;
  onClearConversations: () => void;
}

export const ChatbarSettings: FC<Props> = ({
  lightMode,
  conversationsCount,
  selectedConversation,
  onToggleLightMode,
  onClearConversations,
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAdmin } = useAppSelector((state) => state.auth);
  const [showProfile, setShowProfile] = useState(false);
  const avatarUrl = (user as any)?.picture || (user as any)?.image;

  return (
    <div className={`flex flex-col items-center space-y-2 border-t pt-4 text-sm ${
      lightMode === 'light' ? 'border-gray-200' : 'border-white/10'
    }`}>
      <div className="w-full min-h-[40px]">
        {conversationsCount > 0 && (
          <ClearConversations onClearConversations={onClearConversations} lightMode={lightMode} />
        )}
      </div>

      <SidebarButton
        text={lightMode === 'light' ? 'Dark mode' : 'Light mode'}
        icon={
          lightMode === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />
        }
        onClick={() =>
          onToggleLightMode(lightMode === 'light' ? 'dark' : 'light')
        }
        lightMode={lightMode}
      />

      {/* Admin Upload Button - Only show for admin users */}
      {isAdmin && (
        <SidebarButton
          text="Upload Documents"
          icon={<IconUpload size={18} />}
          onClick={() => {
            // Save the current chatId before navigating to upload
            dispatch(setLastVisitedChatId(selectedConversation?.chatId || null));
            router.push('/admin/upload');
          }}
          lightMode={lightMode}
        />
      )}

      {/* User Profile Button - Only show when user is loaded */}
      {user && (
        <div className={`w-full pt-4 border-t mt-2 ${
          lightMode === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <button
            className={`flex w-full items-center gap-3 rounded-xl py-2.5 px-3 transition-all duration-apple active:scale-[0.98] ${
              lightMode === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'
            }`}
            onClick={() => setShowProfile((v) => !v)}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="User avatar"
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover"
              />
            ) : (
              <IconUser size={18} />
            )}
            <div className="flex flex-col text-left">
              <span className={`text-sm font-medium leading-4 ${
                lightMode === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {user?.username || 'User'}
              </span>
           
            </div>
          </button>

        {showProfile && (
          <div className={`mt-3 rounded-2xl border backdrop-blur-xl p-4 shadow-xl ${
            lightMode === 'light'
              ? 'border-gray-200 bg-white/90'
              : 'border-white/10 bg-white/5'
          }`}>
            <div className={`mb-3 text-xs ${
              lightMode === 'light' ? 'text-gray-700' : 'text-white/70'
            }`}>
              <div className={`font-semibold mb-1 ${
                lightMode === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {user?.username}
              </div>
              <div className={`break-all ${
                lightMode === 'light' ? 'text-gray-600' : 'text-white/50'
              }`}>{user?.username}</div>
            </div>
            <button
              className={`flex w-full items-center gap-3 rounded-xl border backdrop-blur-sm px-3 py-2.5 text-left text-sm font-medium transition-all duration-apple active:scale-[0.98] ${
                lightMode === 'light'
                  ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                  : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => {
                router.push('/home');
                setShowProfile(false);

                dispatch(clearAllChats());
                dispatch(logout());
              }}
            >
              <IconLogout size={18} />
              <span>Log out</span>
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
