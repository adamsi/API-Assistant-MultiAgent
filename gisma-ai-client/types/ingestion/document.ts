export interface CreateDocumentDTO {
  parentFolderId: string | 'root';
}

export interface CreateFolderDTO {
  name: string;
  parentFolderId?: string | null;
}

// Legacy types for backwards compatibility (if needed)
export interface DocumentDTO {
  documentId: string;
  parentFolderId: string;
  file: File;
}

export interface FolderDTO {
  name: string;
  parentFolderId?: string;
}