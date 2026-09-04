import type { FeatureFlag } from './featureFlags';
import type { PersonalizationSettings } from './personalization';

export interface IndexedDriveFolder {
    id: string;
    nodeUid: string;
    name: string;
    path: string;
    spaceId?: string;
    indexedAt: number;
    documentCount: number;
    isActive: boolean;
    treeEventScopeId?: string;
}

/**
 * A lightweight, conversation-scoped persona ("custom agent" / "skill").
 * Definitions are small (name + instructions, optionally backed by a Drive folder)
 * so they live directly in the encrypted, remote-synced LumoUserSettings object.
 */
export interface CustomAgent {
    id: string;
    name: string;
    icon?: string;
    instructions?: string;
    description?: string;
    conversationStarters?: string[];
    hidden?: boolean;
    source: 'personal' | 'published' | 'shared';
    createdAt: number;
    updatedAt: number;
}

/** `user` = written in settings; `generated` = from chats (bootstrap, refresh, or future auto-save). */
export type MemorySource = 'user' | 'generated';

export interface Memory {
    id: string;
    content: string;
    createdAt: number;
    source?: MemorySource;
}

export type ChatHistoryDateField = 'updatedAt' | 'createdAt';

export interface LumoUserSettings {
    theme: 'light' | 'dark' | 'auto';
    personalization: PersonalizationSettings;
    featureFlags: FeatureFlag[];
    indexedDriveFolders?: IndexedDriveFolder[];
    customAgents?: CustomAgent[];
    showProjectConversationsInHistory?: boolean;
    chatHistoryDateField?: ChatHistoryDateField;
    automaticWebSearch?: boolean;
    animatedBackgroundEnabled?: boolean;
    animatedBackgroundBlobMode?: 'ambient' | 'lavaLamp';
    showGallerySuggestions: boolean;
    memories?: Memory[];
    isMemoryEnabled?: boolean;
    isMemoryAutoSaveEnabled?: boolean;
    isVisualizationInstructionsEnabled?: boolean;
    memoryPromptsSinceAutoSave?: number;
    /** Newest chat prompt included in a scan that successfully persisted at least one memory. */
    memoryLastProcessedMessageAt?: string;
    preferredModelTier?: 'lumo-lite' | 'lumo-max' | 'apertus-15';
    preferredResponseMode?: 'fast' | 'thinking';
    apertusOnboardingAcceptedAt?: number;
}
