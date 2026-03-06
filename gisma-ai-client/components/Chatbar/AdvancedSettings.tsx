import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { ResponseFormat } from '@/types/responseFormat';
import { IconAdjustments, IconX } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';

interface Props {
  conversation: Conversation;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  compact?: boolean;
}

export const AdvancedSettings: FC<Props> = ({
  conversation,
  onUpdateConversation,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localResponseFormat, setLocalResponseFormat] = useState<ResponseFormat>(
    conversation.responseFormat || ResponseFormat.SIMPLE,
  );
  const [localSchemaJson, setLocalSchemaJson] = useState<string>(
    conversation.schemaJson || '',
  );
  const [localTextDirection, setLocalTextDirection] = useState<'ltr' | 'rtl'>(
    conversation.textDirection || 'ltr',
  );
  const [error, setError] = useState<string>('');

  // Update local state when conversation changes
  useEffect(() => {
    setLocalResponseFormat(conversation.responseFormat || ResponseFormat.SIMPLE);
    setLocalSchemaJson(conversation.schemaJson || '');
    setLocalTextDirection(conversation.textDirection || 'ltr');
    setError('');
  }, [conversation]);

  const handleSave = () => {
    // Validate that schema is provided and valid when SCHEMA format is selected
    if (localResponseFormat === ResponseFormat.SCHEMA) {
      if (!localSchemaJson.trim()) {
        setError('JSON Schema is required when Schema format is selected.');
        return;
      }
      
      // Validate JSON format
      try {
        JSON.parse(localSchemaJson);
        setError('');
      } catch (e) {
        setError('Invalid JSON. Please provide valid JSON schema.');
        return;
      }
    }
    
    setError('');
    
    // First update responseFormat
    onUpdateConversation(conversation, {
      key: 'responseFormat',
      value: localResponseFormat,
    });
    
    // Create updated conversation with the new responseFormat for the second update
    const updatedWithFormat = {
      ...conversation,
      responseFormat: localResponseFormat,
    };
    
    // Then update schemaJson using the conversation that already has the updated responseFormat
    const updatedWithSchema = {
      ...updatedWithFormat,
      schemaJson: localResponseFormat === ResponseFormat.SCHEMA ? localSchemaJson : undefined,
    };
    
    onUpdateConversation(updatedWithSchema, {
      key: 'schemaJson',
      value: localResponseFormat === ResponseFormat.SCHEMA ? localSchemaJson : undefined,
    });
    
    // Update textDirection
    const updatedWithTextDirection = {
      ...updatedWithSchema,
      textDirection: localTextDirection,
    };
    
    onUpdateConversation(updatedWithTextDirection, {
      key: 'textDirection',
      value: localTextDirection,
    });
    
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={compact 
          ? "flex items-center justify-center rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#40414F] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] p-3 text-neutral-800 opacity-60 hover:opacity-80 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200 transition-all" 
          : "flex w-full cursor-pointer items-center gap-3 rounded-md border border-white/20 p-3 text-[14px] leading-normal text-white transition-colors duration-200 hover:bg-gray-500/10"}
        onClick={() => setIsOpen(true)}
        title="Advanced Settings"
      >
        <IconAdjustments size={20} />
        {!compact && 'Advanced Settings'}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLocalResponseFormat(conversation.responseFormat || ResponseFormat.SIMPLE);
              setLocalSchemaJson(conversation.schemaJson || '');
              setLocalTextDirection(conversation.textDirection || 'ltr');
              setIsOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-lg mx-4 rounded-lg bg-[#202123] border border-white/20 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/20 p-6">
              <h3 className="text-xl font-semibold text-white">
                Advanced Settings
              </h3>
              <button
                className="rounded hover:bg-gray-500/10 p-1 text-white transition-colors"
                onClick={() => {
                  // Reset local state to conversation state
                  setLocalResponseFormat(conversation.responseFormat || ResponseFormat.SIMPLE);
                  setLocalSchemaJson(conversation.schemaJson || '');
                  setLocalTextDirection(conversation.textDirection || 'ltr');
                  setIsOpen(false);
                }}
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Response Format
                </label>
                <select
                  value={localResponseFormat}
                  onChange={(e) =>
                    setLocalResponseFormat(e.target.value as ResponseFormat)
                  }
                  className="w-full h-12 rounded-md border border-white/20 bg-[#343541] px-6 py-3 pr-16 text-white text-base focus:border-blue-500 focus:outline-none transition-all [&::-ms-expand]:hidden appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 7l5 5 5-5' stroke='%23fff' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5rem 1.5rem',
                  }}
                >
                  <option value={ResponseFormat.SIMPLE}>Simple</option>
                  <option value={ResponseFormat.JSON}>JSON</option>
                  <option value={ResponseFormat.SCHEMA}>Schema</option>
                </select>
              </div>

              {localResponseFormat === ResponseFormat.SCHEMA && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    JSON Schema <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={localSchemaJson}
                    onChange={(e) => {
                      setLocalSchemaJson(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder='{"type":"object","properties":{...}}'
                    required
                    className={`w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none transition-all ${
                      error 
                        ? 'border-red-500 bg-[#4a2430] focus:border-red-500' 
                        : 'border-white/20 bg-[#343541] focus:border-blue-500'
                    }`}
                    rows={6}
                  />
                  {error ? (
                    <p className="mt-1 text-xs text-red-400">
                      {error}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      Required when using Schema format
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Language
                </label>
                <select
                  value={localTextDirection}
                  onChange={(e) =>
                    setLocalTextDirection(e.target.value as 'ltr' | 'rtl')
                  }
                  className="w-full h-12 rounded-md border border-white/20 bg-[#343541] px-6 py-3 pr-16 text-white text-base focus:border-blue-500 focus:outline-none transition-all [&::-ms-expand]:hidden appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 7l5 5 5-5' stroke='%23fff' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5rem 1.5rem',
                  }}
                >
                  <option value="ltr">English</option>
                  <option value="rtl">Hebrew</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    // Reset local state to conversation state
                    setLocalResponseFormat(conversation.responseFormat || ResponseFormat.SIMPLE);
                    setLocalSchemaJson(conversation.schemaJson || '');
                    setLocalTextDirection(conversation.textDirection || 'ltr');
                    setIsOpen(false);
                  }}
                  className="flex-1 rounded-md border border-white/20 bg-[#343541] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-gray-500/10 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

