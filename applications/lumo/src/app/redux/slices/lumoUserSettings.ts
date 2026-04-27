import { createAction, createReducer } from '@reduxjs/toolkit';

import { getDefaultSettings, getLumoSettings } from '../../providers';
import { localSettingsToUserSettings } from '../../providers';
import type { FeatureFlag } from './featureFlags';
import { loadLumoUserSettingsFromRemote, saveLumoUserSettingsToRemote } from './lumoUserSettingsThunks';
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

export interface LumoUserSettings {
    theme: 'light' | 'dark' | 'auto';
    personalization: PersonalizationSettings;
    featureFlags: FeatureFlag[];
    indexedDriveFolders?: IndexedDriveFolder[];
    showProjectConversationsInHistory?: boolean;
    automaticWebSearch?: boolean;
    showGallerySuggestions: boolean;
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
    automaticWebSearch: true, // Default to enabled (automatic)
    showGallerySuggestions: true,
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
export { loadLumoUserSettingsFromRemote, saveLumoUserSettingsToRemote };
