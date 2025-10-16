import { createAction, createReducer } from '@reduxjs/toolkit';

import { getDefaultSettings, getLumoSettings } from '../../providers/lumoThemeStorage';
import { localSettingsToUserSettings } from '../../providers/lumoThemeUtils';
import { loadLumoUserSettingsFromRemote, saveLumoUserSettingsToRemote } from './lumoUserSettingsThunks';
import type { PersonalizationSettings } from './personalization';

export interface LumoUserSettings {
    theme: 'light' | 'dark' | 'auto';
    personalization: PersonalizationSettings;
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
            return action.payload;
        })
        .addCase(loadLumoUserSettingsFromRemote.fulfilled, (state, action) => {
            if (action.payload) {
                return action.payload;
            }
            return state;
        });
});

export default lumoUserSettingsReducer;

// Export thunks
export { saveLumoUserSettingsToRemote, loadLumoUserSettingsFromRemote };
