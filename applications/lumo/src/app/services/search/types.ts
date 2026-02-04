import type { LumoState } from '../../redux/store';

export type SearchResult =
    | {
          type: 'conversation';
          conversationId: string;
          conversationTitle: string;
          timestamp: number;
          projectName?: string; // Project name if conversation is in a project
          projectIcon?: string; // Project icon if conversation is in a project
      }
    | {
          type: 'message';
          conversationId: string;
          messageId: string;
          conversationTitle: string;
          messagePreview: string;
          timestamp: number;
          projectName?: string; // Project name if conversation is in a project
          projectIcon?: string; // Project icon if conversation is in a project
      }
    | {
          type: 'project';
          projectId: string;
          projectName: string;
          projectIcon?: string;
          projectDescription?: string;
          timestamp: number;
      }
    | {
          type: 'document';
          documentId: string;
          documentName: string;
          documentPreview?: string; // folder path
          matchContext?: string; // snippet with context around the match
          timestamp: number;
      };

      
// Narrow state shape needed for search to avoid passing full Redux state
export type SearchState = Pick<LumoState, 'conversations' | 'messages' | 'spaces'>;

export interface SearchServiceStatus {
    tableExists: boolean;
    hasEntries: boolean;
    entryCount: number;
    isEnabled: boolean;
    totalBytes?: number;
    error?: string;
    driveDocuments?: number;
    driveDocumentsUnique?: number;
    driveChunks?: number;
    indexedFolders?: number;
    bm25Stats?: {
        totalDocs: number;
        vocabularySize: number;
        avgDocLength: number;
    };
}

export interface SearchOptions {
    hasLumoPlus?: boolean;
}

export interface SearchService {
    getAllConversations(state: SearchState, options?: SearchOptions): Promise<SearchResult[]>;
    searchAsync(query: string, state: SearchState, options?: SearchOptions): Promise<SearchResult[]>;
    getStatus(): Promise<SearchServiceStatus>;
}