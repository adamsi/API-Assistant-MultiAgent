import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, handleAxiosError } from '@/utils/api';
import { CreateFolderDTO } from '@/types/ingestion';
import { FolderEntity, DocumentEntity } from '@/types/ingestion';

interface UploadState {
  uploading: boolean;
  uploadProgress: number;
  uploadedFiles: string[];
  error: string | null;
  success: string | null;
  rootFolder: FolderEntity | null;
  currentFolder: FolderEntity | null;
  loading: boolean;
  deleting: boolean;
}

const initialState: UploadState = {
  uploading: false,
  uploadProgress: 0,
  uploadedFiles: [],
  error: null,
  success: null,
  rootFolder: null,
  currentFolder: null,
  loading: false,
  deleting: false,
};

// Create new documents
export const uploadFiles = createAsyncThunk(
  'upload/uploadFiles',
  async ({ files, parentFolderId }: { files: File[]; parentFolderId: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Add all files with the same key 'files' - Spring Boot will collect them into a List<MultipartFile>
      files.forEach(file => formData.append('files', file));
      
      
      formData.append('parentFolderId', parentFolderId);

      const response = await api.post('/ingestion/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          // Progress will be handled in the component via the thunk
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

// Edit an existing document
export const editDocument = createAsyncThunk(
  'upload/editDocument',
  async ({ file, documentId }: { file: File; documentId: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Add the file
      formData.append('file', file);
      
      // Add the UUID as a text/plain blob so Spring Boot can deserialize it
      const idBlob = new Blob([documentId], { type: 'text/plain' });
      formData.append('id', idBlob);

      const response = await api.patch('/ingestion/documents/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },  
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const fetchRootFolder = createAsyncThunk(
  'upload/fetchRootFolder',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/ingestion/folders', {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const createFolder = createAsyncThunk(
  'upload/createFolder',
  async (folderData: CreateFolderDTO, { rejectWithValue }) => {
    try {
      const response = await api.post('/ingestion/folders', folderData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const deleteDocuments = createAsyncThunk(
  'upload/deleteDocuments',
  async (ids: string[], { rejectWithValue }) => {
    try {
      await api.delete('/ingestion/documents', {
        data: ids,
        withCredentials: true,
      });
      return ids;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const deleteFolders = createAsyncThunk(
  'upload/deleteFolders',
  async (ids: string[], { rejectWithValue }) => {
    try {
      await api.delete('/ingestion/folders', {
        data: ids,
        withCredentials: true,
      });
      return ids;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearUploadState: (state) => {
      state.uploading = false;
      state.uploadProgress = 0;
      state.error = null;
      state.success = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setCurrentFolder: (state, action: PayloadAction<FolderEntity>) => {
      state.currentFolder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload files
      .addCase(uploadFiles.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
        state.success = null;
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.success = 'Files uploaded successfully!';
        state.error = null;
        // Refresh the folder structure after upload
        // In a real app, you might want to refetch or update locally
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload as string;
        state.success = null;
      })
      // Edit document
      .addCase(editDocument.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
        state.success = null;
      })
      .addCase(editDocument.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.success = 'Document updated successfully!';
        state.error = null;
      })
      .addCase(editDocument.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload as string;
        state.success = null;
      })
      // Fetch root folder
      .addCase(fetchRootFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRootFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.rootFolder = action.payload;
        state.currentFolder = action.payload;
        state.error = null;
      })
      .addCase(fetchRootFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create folder
      .addCase(createFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Folder created successfully!';
        state.error = null;
        // Refresh the folder structure after creation
        // In a real app, you might want to refetch or update locally
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete documents
      .addCase(deleteDocuments.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteDocuments.fulfilled, (state, action) => {
        state.deleting = false;
        state.success = `${action.payload.length} document(s) deleted successfully!`;
        state.error = null;
      })
      .addCase(deleteDocuments.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      })
      // Delete folders
      .addCase(deleteFolders.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteFolders.fulfilled, (state, action) => {
        state.deleting = false;
        state.success = `${action.payload.length} folder(s) deleted successfully!`;
        state.error = null;
      })
      .addCase(deleteFolders.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccess, clearUploadState, setUploadProgress, setCurrentFolder } = uploadSlice.actions;
export default uploadSlice.reducer;
