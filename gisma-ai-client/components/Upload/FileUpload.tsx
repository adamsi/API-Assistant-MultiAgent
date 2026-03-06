import React, { useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store/hooks';
import { IconUpload, IconX, IconFile } from '@tabler/icons-react';
import { uploadFiles, fetchRootFolder } from '@/store/slices/uploadSlice';
import { RootState } from '@/store';

interface FileUploadProps {
  className?: string;
  parentFolderId: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ className = '', parentFolderId }) => {
  const dispatch = useAppDispatch();
  const { uploading, uploadProgress } = useSelector((state: RootState) => state.upload);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await dispatch(uploadFiles({ files: selectedFiles, parentFolderId })).unwrap();
      setSelectedFiles([]);
      // Refresh the folder structure after upload
      dispatch(fetchRootFolder());
    } catch (error: unknown) {
      // Error is handled by the toast in parent component
      console.error('Upload failed:', error);
    }
  }, [dispatch, selectedFiles, parentFolderId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer backdrop-blur-sm
          ${dragActive 
            ? 'border-blue-400 bg-blue-500/15 scale-[1.01] shadow-xl shadow-blue-500/20' 
            : 'border-white/20 hover:border-blue-400/60 hover:bg-blue-500/8 hover:shadow-lg hover:shadow-blue-500/10'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept="*/*"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm
              ${dragActive 
                ? 'bg-blue-500/25 scale-105 shadow-lg shadow-blue-500/30' 
                : 'bg-blue-500/15 hover:bg-blue-500/25 hover:shadow-lg hover:shadow-blue-500/20'
              }
            `}>
              <IconUpload className={`w-8 h-8 transition-all duration-300 ${
                dragActive ? 'text-blue-200 scale-105' : 'text-blue-300'
              }`} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {dragActive ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-blue-200/80 text-base">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-blue-300/60 text-sm">
              Supports multiple files
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-base font-semibold text-white text-center">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-black/20 backdrop-blur-xl rounded-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <IconFile className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`
              w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-base
              ${uploading
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.01] shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
              }
            `}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <IconUpload className="w-4 h-4" />
                <span>Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-700/50 rounded-full h-2 backdrop-blur-sm">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default FileUpload;
