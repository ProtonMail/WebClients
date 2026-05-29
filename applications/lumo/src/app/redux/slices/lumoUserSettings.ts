import { createAction, createReducer } from '@reduxjs/toolkit';

import { getDefaultSettings, getLumoSettings, localSettingsToUserSettings } from '../../providers';
import type { FeatureFlag } from './featureFlags';
import {
    appendGeneratedMemoriesThunk,
    loadLumoUserSettingsFromRemote,
    saveLumoUserSettingsToRemote,
} from './lumoUserSettingsThunks';
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
    icon?: string; // icon identifier, reuses the project icon set (e.g. 'health', 'finance')
    instructions?: string; // inline system-prompt text
    description?: string; // short one-line summary, shown in the picker
    // Suggested prompts shown as clickable chips on the agent's welcome screen.
    conversationStarters?: string[];
    // Hidden agents are not listed in the picker by default (but still resolve by id, can be
    // activated via a `?skill=` link, and appear when explicitly searched or currently active).
    hidden?: boolean;
    /**
     * Provenance of the agent:
     * - 'personal': authored by the user, stored in their settings, editable.
     * - 'published': Proton-vetted, code-shipped built-in agent (read-only, verified).
     * - 'shared': received from another user (future; stricter trust UX).
     */
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

export interface LumoUserSettings {
    theme: 'light' | 'dark' | 'auto';
    personalization: PersonalizationSettings;
    featureFlags: FeatureFlag[];
    indexedDriveFolders?: IndexedDriveFolder[];
    customAgents?: CustomAgent[];
    showProjectConversationsInHistory?: boolean;
    automaticWebSearch?: boolean;
    animatedBackgroundEnabled?: boolean;
    showGallerySuggestions: boolean;
    memories?: Memory[];
    isMemoryEnabled?: boolean;
    isMemoryAutoSaveEnabled?: boolean;
    /** General-chat user prompts since the last background memory update. */
    memoryPromptsSinceAutoSave?: number;
}

const getInitialThemeFromLocalStorage = (): 'light' | 'dark' | 'auto' => {
    try {
        const localSettings = getLumoSettings() || getDefaultSettings();
        const theme = localSettingsToUserSettings(localSettings);
        console.log('debug: initialLumoUserSettings theme from localStorage:', { localSettings, theme });
        return theme;
    } catch (error) {
        console.log('debug: initialLumoUserSettings fallback to auto due to error:', error);
        // Fallback to auto if there's any error
        return 'auto';
    }
};

export const initialLumoUserSettings: LumoUserSettings = {
    theme: getInitialThemeFromLocalStorage(),
    personalization: {
        nickname: '',
        jobRole: '',
        personality: 'default',
        traits: [],
        lumoTraits: '',
        additionalContext: '',
        enableForNewChats: true,
    },
    featureFlags: [],
    indexedDriveFolders: [],
    customAgents: [],
    automaticWebSearch: true, // Default to enabled (automatic)
    showGallerySuggestions: true,
    memories: [],
    isMemoryEnabled: false,
    isMemoryAutoSaveEnabled: true,
    memoryPromptsSinceAutoSave: 0,
};

// Actions
export const updateLumoUserSettings = createAction<Partial<LumoUserSettings>>(
    'lumoUserSettings/updateLumoUserSettings'
);
export const updateLumoUserSettingsWithAutoSave = createAction<Partial<LumoUserSettings>>(
    'lumoUserSettings/updateLumoUserSettingsWithAutoSave'
);
export const resetLumoUserSettings = createAction('lumoUserSettings/resetLumoUserSettings');
export const setLumoUserSettings = createAction<LumoUserSettings>('lumoUserSettings/setLumoUserSettings');

// Reducer
const lumoUserSettingsReducer = createReducer(initialLumoUserSettings, (builder) => {
    builder
        .addCase(updateLumoUserSettings, (state, action) => {
            return { ...state, ...action.payload };
        })
        .addCase(updateLumoUserSettingsWithAutoSave, (state, action) => {
            return { ...state, ...action.payload };
        })
        .addCase(resetLumoUserSettings, () => {
            return initialLumoUserSettings;
        })
        .addCase(setLumoUserSettings, (state, action) => {
            // Merge on top of defaults so any new fields introduced after the
            // settings were last saved still get their initial values.
            return { ...initialLumoUserSettings, ...action.payload };
        })
        .addCase(loadLumoUserSettingsFromRemote.fulfilled, (state, action) => {
            if (action.payload) {
                // Same merge strategy — remote settings win, but new fields
                // fall back to their defaults rather than becoming undefined.
                return { ...initialLumoUserSettings, ...action.payload };
            }
            return state;
        });
});

export default lumoUserSettingsReducer;

// Export thunks
export { appendGeneratedMemoriesThunk, loadLumoUserSettingsFromRemote, saveLumoUserSettingsToRemote };
