import { FC } from 'react';

interface Props {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
  lightMode?: 'light' | 'dark';
}

export const SidebarButton: FC<Props> = ({ text, icon, onClick, lightMode = 'dark' }) => {
  return (
    <button
      className={`flex w-full cursor-pointer select-none items-center gap-3 rounded-xl py-2.5 px-3 text-sm font-medium transition-all duration-apple active:scale-[0.98] ${
        lightMode === 'light'
          ? 'text-gray-900 hover:bg-gray-100'
          : 'text-white hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">{icon}</div>
      <span>{text}</span>
    </button>
  );
};
