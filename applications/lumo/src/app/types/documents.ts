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
    // Chunking metadata (for large documents split into sections)
    isChunk?: boolean;
    parentDocumentId?: string; // Original document ID for chunks
    chunkIndex?: number;
    totalChunks?: number;
    chunkTitle?: string; // Section title or context for this chunk
}

