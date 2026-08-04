import { createReducer } from '@reduxjs/toolkit';

import { getDefaultSettings, getLumoSettings } from '../../providers/lumoThemeStorage';
import { localSettingsToUserSettings } from '../../providers/lumoThemeUtils';
import {
    resetLumoUserSettings,
    setLumoUserSettings,
    updateLumoUserSettings,
    updateLumoUserSettingsWithAutoSave,
} from './lumoUserSettingsActions';
import { loadLumoUserSettingsFromRemote } from './lumoUserSettingsThunks';
import type { LumoUserSettings } from './lumoUserSettingsTypes';

export type {
    ChatHistoryDateField,
    CustomAgent,
    IndexedDriveFolder,
    LumoUserSettings,
    Memory,
    MemorySource,
} from './lumoUserSettingsTypes';

export {
    resetLumoUserSettings,
    setLumoUserSettings,
    updateLumoUserSettings,
    updateLumoUserSettingsWithAutoSave,
} from './lumoUserSettingsActions';

/** Builds initial settings from `lumo-settings` in localStorage. */
export const createInitialLumoUserSettings = (): LumoUserSettings => {
    let theme: LumoUserSettings['theme'] = 'auto';
    let animatedBackgroundEnabled: boolean | undefined;
    let animatedBackgroundBlobMode: LumoUserSettings['animatedBackgroundBlobMode'];

    try {
        const localSettings = getLumoSettings() || getDefaultSettings();
        theme = localSettingsToUserSettings(localSettings);
        if (typeof localSettings.animatedBackgroundEnabled === 'boolean') {
            animatedBackgroundEnabled = localSettings.animatedBackgroundEnabled;
        }
        if (
            localSettings.animatedBackgroundBlobMode === 'ambient' ||
            localSettings.animatedBackgroundBlobMode === 'lavaLamp'
        ) {
            animatedBackgroundBlobMode = localSettings.animatedBackgroundBlobMode;
        }
    } catch {
        // Fall back to defaults above
    }

    return {
        theme,
        ...(animatedBackgroundEnabled !== undefined && { animatedBackgroundEnabled }),
        ...(animatedBackgroundBlobMode !== undefined && { animatedBackgroundBlobMode }),
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
        automaticWebSearch: true,
        showGallerySuggestions: true,
        chatHistoryDateField: 'updatedAt',
        memories: [],
        isMemoryEnabled: false,
        isMemoryAutoSaveEnabled: true,
        isVisualizationInstructionsEnabled: true,
        memoryPromptsSinceAutoSave: 0,
    };
};

export const initialLumoUserSettings = createInitialLumoUserSettings();

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
            return { ...initialLumoUserSettings, ...action.payload };
        })
        .addCase(loadLumoUserSettingsFromRemote.fulfilled, (state, action) => {
            if (action.payload) {
                return { ...initialLumoUserSettings, ...action.payload };
            }
            return state;
        });
});

export default lumoUserSettingsReducer;

export {
    appendGeneratedMemoriesThunk,
    loadLumoUserSettingsFromRemote,
    saveLumoUserSettingsToRemote,
} from './lumoUserSettingsThunks';
