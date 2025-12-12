export type FolderIndexingStatus =
    | {
          folderId: string;
          status: 'indexing';
          progress: { indexed: number; total: number };
          stage?: string;
          error?: string;
      }
    | {
          folderId: string;
          status: 'complete';
          progress: { indexed: number; total: number };
      }
    | {
          folderId: string;
          status: 'error';
          progress: { indexed: number; total: number };
          error: string;
      };

export interface DriveDocument {
    id: string;
    name: string;
    content: string;
    mimeType: string;
    size: number;
    modifiedTime: number;
    folderId: string;
    folderPath: string;
    spaceId?: string;
}

