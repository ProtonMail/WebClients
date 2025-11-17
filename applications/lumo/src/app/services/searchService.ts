import type { LumoState } from '../redux/store';
import { Role } from '../types';
import { selectConversations, selectMessages } from '../redux/selectors';

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
          documentPreview?: string;
          timestamp: number;
      };

export class SearchService {
    private static instance: SearchService | null = null;

    private constructor() {}

    static get(): SearchService {
        if (!SearchService.instance) {
            SearchService.instance = new SearchService();
        }
        return SearchService.instance;
    }

    /**
     * Get all conversations (for default view)
     * @param state Redux state
     */
    async getAllConversations(state: LumoState): Promise<SearchResult[]> {
        const conversations = selectConversations(state);
        const spaces = state.spaces;
        const results: SearchResult[] = [];

        // Helper to get project info for a space
        const getProjectInfo = (spaceId: string): { projectName?: string; projectIcon?: string } => {
            const space = spaces[spaceId];
            if (space?.isProject) {
                return {
                    projectName: space.projectName,
                    projectIcon: space.projectIcon,
                };
            }
            return {};
        };

        // Convert all conversations to SearchResult format
        Object.values(conversations).forEach((conversation) => {
            const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
            const timestamp = new Date(conversation.createdAt).getTime();

            results.push({
                type: 'conversation',
                conversationId: conversation.id,
                conversationTitle: conversation.title || 'Untitled',
                timestamp,
                ...projectInfo,
            });
        });

        // Sort by timestamp (newest first)
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Search conversations and messages
     * @param query Search query string
     * @param state Redux state to search in
     */
    async searchAsync(query: string, state: LumoState): Promise<SearchResult[]> {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) {
            return [];
        }

        const results: SearchResult[] = [];
        const conversations = selectConversations(state);
        const messages = selectMessages(state);
        const spaces = state.spaces;

        // Helper to get project info for a space
        const getProjectInfo = (spaceId: string): { projectName?: string; projectIcon?: string } => {
            const space = spaces[spaceId];
            if (space?.isProject) {
                return {
                    projectName: space.projectName,
                    projectIcon: space.projectIcon,
                };
            }
            return {};
        };

        // Search conversations by title
        Object.values(conversations).forEach((conversation) => {
            const title = conversation.title?.toLowerCase() || '';
            if (title.includes(normalizedQuery)) {
                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
                const timestamp = new Date(conversation.createdAt).getTime();

                results.push({
                    type: 'conversation',
                    conversationId: conversation.id,
                    conversationTitle: conversation.title || 'Untitled',
                    timestamp,
                    ...projectInfo,
                });
            }
        });

        // Search projects by name and description
        Object.values(spaces).forEach((space) => {
            if (!space.isProject) {
                return;
            }

            const projectName = space.projectName?.toLowerCase() || '';
            const projectDescription = space.projectInstructions?.toLowerCase() || '';
            
            if (projectName.includes(normalizedQuery) || projectDescription.includes(normalizedQuery)) {
                const timestamp = new Date(space.createdAt).getTime();

                results.push({
                    type: 'project',
                    projectId: space.id,
                    projectName: space.projectName || 'Untitled Project',
                    projectIcon: space.projectIcon,
                    projectDescription: space.projectInstructions,
                    timestamp,
                });
            }
        });

        // Search messages by content
        Object.values(messages).forEach((message) => {
            // Only search user and assistant messages (skip system/tool messages)
            if (message.role !== Role.User && message.role !== Role.Assistant) {
                return;
            }

            const content = message.content?.toLowerCase() || '';
            if (content.includes(normalizedQuery)) {
                const conversation = conversations[message.conversationId];
                if (!conversation) {
                    return;
                }

                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
                const timestamp = new Date(message.createdAt).getTime();

                // Extract preview text (first 100 chars)
                const preview = message.content?.substring(0, 100) || '';

                results.push({
                    type: 'message',
                    conversationId: message.conversationId,
                    messageId: message.id,
                    conversationTitle: conversation.title || 'Untitled',
                    messagePreview: preview,
                    timestamp,
                    ...projectInfo,
                });
            }
        });

        // Remove duplicates (if a conversation matches both title and message, prefer conversation result)
        const seenConversations = new Set<string>();
        const deduplicated: SearchResult[] = [];

        // First pass: add conversation results
        results.forEach((result) => {
            if (result.type === 'conversation') {
                if (!seenConversations.has(result.conversationId)) {
                    seenConversations.add(result.conversationId);
                    deduplicated.push(result);
                }
            }
        });

        // Second pass: add message results only if we don't already have the conversation
        // Also add project and document results
        results.forEach((result) => {
            if (result.type === 'message') {
                // Skip if we already have a conversation result for this conversation
                if (!seenConversations.has(result.conversationId)) {
                    deduplicated.push(result);
                }
            } else if (result.type === 'project' || result.type === 'document') {
                deduplicated.push(result);
            }
        });

        // Sort by timestamp (newest first)
        return deduplicated.sort((a, b) => b.timestamp - a.timestamp);
    }
}

