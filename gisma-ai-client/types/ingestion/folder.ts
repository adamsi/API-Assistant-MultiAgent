
export interface FolderEntity {
  id: string;
  name: string;
  parentFolder?: FolderEntity;
  childrenFolders?: FolderEntity[];
  childrenDocuments?: DocumentEntity[];
}

export interface DocumentEntity {
  id: string;
  url: string;
  name: string;
  contentType?: string;
  parentFolder?: FolderEntity;
}
