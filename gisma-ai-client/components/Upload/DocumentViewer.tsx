import React, { useState, useEffect, useCallback } from 'react';
import { IconX, IconDeviceFloppy, IconEye, IconFile } from '@tabler/icons-react';
import { DocumentEntity } from '@/types/ingestion';
import LoadingSpinner from '@/components/Global/LoadingSpinner';

interface DocumentViewerProps {
  document: DocumentEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (content: string) => Promise<void>;
}

enum FileType {
  PDF = 'pdf',
  IMAGE = 'image',
  TEXT = 'text',
  UNSUPPORTED = 'unsupported',
}

const getFileType = (contentType: string | null | undefined): FileType => {
  if (!contentType) return FileType.TEXT;

  if (contentType.includes('pdf')) {
    return FileType.PDF;
  }

  if (contentType.startsWith('image/')) {
    return FileType.IMAGE;
  }

  if (
    contentType.startsWith('text/') ||
    contentType.includes('json') ||
    contentType.includes('xml') ||
    contentType.includes('javascript') ||
    contentType.includes('css') ||
    contentType.includes('html')
  ) {
    return FileType.TEXT;
  }

  return FileType.UNSUPPORTED;
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  onSave,
}) => {
  const [documentContent, setDocumentContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileType = document ? getFileType(document.contentType) : FileType.TEXT;
  const isEditable = fileType === FileType.TEXT && !!onSave;
  const hasChanges = documentContent !== originalContent;

  const loadTextContent = useCallback(async () => {
    if (!document) return;

    setIsLoading(true);
    try {
      const response = await fetch(document.url);
      if (response.ok) {
        const content = await response.text();
        setDocumentContent(content);
        setOriginalContent(content);
      } else {
        setDocumentContent('');
        setOriginalContent('');
      }
    } catch (error) {
      console.error('Failed to load document content:', error);
      setDocumentContent('');
      setOriginalContent('');
    } finally {
      setIsLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (!isOpen || !document) {
      return;
    }

    // Reset state when opening a new document
    setDocumentContent('');
    setOriginalContent('');
    setIsSaving(false);

    // Only fetch content for text files
    if (fileType === FileType.TEXT) {
      setIsLoading(true);
      loadTextContent();
    } else {
      setIsLoading(false);
    }
  }, [isOpen, document?.id, fileType, loadTextContent]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      await onSave(documentContent);
      setOriginalContent(documentContent);
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !document) {
    return null;
  }

  const renderContent = () => {
    switch (fileType) {
      case FileType.PDF:
        return (
          <iframe
            src={document.url}
            className="w-full h-full border-0 bg-white"
            title={document.name}
          />
        );

      case FileType.IMAGE:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-800/20 overflow-hidden">
            <img
              src={document.url}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      case FileType.TEXT:
        return (
          <>
            {isLoading && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/50 via-gray-700/40 to-gray-800/50 z-10 transition-opacity duration-300">
                <LoadingSpinner />
              </div>
            )}
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className={`w-full h-full px-8 sm:px-12 py-6 sm:py-8 bg-transparent text-gray-100 font-mono text-lg sm:text-xl leading-relaxed resize-none focus:outline-none selection:bg-blue-500/40 selection:text-white transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              spellCheck={false}
              placeholder="Document content will be loaded here..."
              style={{ 
                tabSize: 2,
                lineHeight: '1.8'
              }}
            />
          </>
        );

      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/20 p-6">
            <IconFile className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-white text-xl font-medium mb-2">Preview not available</p>
            <p className="text-blue-200/70 text-base mb-4 text-center">
              This file type ({document.contentType || 'unknown'}) cannot be previewed
            </p>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 text-base"
            >
              Open in new tab
            </a>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-950/95 backdrop-blur-xl w-full h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-[1400px] flex flex-col max-w-full shadow-2xl border border-white/10">
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                {document.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isEditable && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  !hasChanges || isSaving
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600/90 text-white hover:bg-green-500/90'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area - Full Editor View */}
        <div className="flex-1 bg-gradient-to-br from-gray-800/50 via-gray-700/40 to-gray-800/50 min-h-0 overflow-auto relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

