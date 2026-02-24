import type { SpaceId } from '../../types';

export interface Project {
    id: string; // Maps to SpaceId when not an example
    name: string;
    description?: string;
    instructions?: string; // Project instructions / system prompt
    icon?: string; // Icon category ID
    fileCount?: number;
    conversationCount?: number;
    createdAt?: string;
    updatedAt?: string;
    isExample?: boolean;
    spaceId?: SpaceId; // Actual space ID for non-examples
    promptSuggestions?: string[]; // Suggested prompts for example projects
}

