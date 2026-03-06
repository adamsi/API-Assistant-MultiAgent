import { IconX } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  placeholder: string;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
  lightMode?: 'light' | 'dark';
}

export const Search: FC<Props> = ({ placeholder, searchTerm, onSearch, lightMode = 'dark' }) => {

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    onSearch('');
  };

  return (
    <div className="relative flex items-center">
      <input
        className={`w-full flex-1 rounded-xl border backdrop-blur-sm px-4 py-3 pr-10 text-sm transition-all duration-apple focus:outline-none ${
          lightMode === 'light'
            ? 'border-gray-300 bg-white/90 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white'
            : 'border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/10'
        }`}
        type="text"
        placeholder={placeholder || ''}
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {searchTerm && (
        <IconX
          className={`absolute right-4 cursor-pointer transition-colors duration-apple ${
            lightMode === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-white/50 hover:text-white'
          }`}
          size={18}
          onClick={clearSearch}
        />
      )}
    </div>
  );
};
