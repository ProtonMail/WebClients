import { createAsyncThunk } from '@reduxjs/toolkit';

import { base64ToMasterKey } from '../../crypto';
import { deserializeUserSettings, serializeUserSettings } from '../../serialization';
import { mergeAppendedGeneratedMemories, normalizeMemories } from '../../util/memoryHelpers';
import { safeLogger } from '../../util/safeLogger';
import type { LumoDispatch, LumoState } from '../store';
import type { LumoThunkArguments } from '../thunk';
import { updateLumoUserSettingsWithAutoSave } from './lumoUserSettings';
import type { LumoUserSettings, Memory } from './lumoUserSettings';

/**
 * Atomically merges `generated` into the latest persisted memories, resetting the
 * "prompts since last update" counter. Reading state inside the thunk avoids the race
 * where memories added or edited during a long-running generation get clobbered when the
 * caller persists a stale snapshot.
 *
 * Returns the number of newly added memories.
 */
export const appendGeneratedMemoriesThunk =
    (generated: Memory[]) =>
    (dispatch: LumoDispatch, getState: () => LumoState): number => {
        const current = normalizeMemories(getState().lumoUserSettings.memories);
        const merged = mergeAppendedGeneratedMemories(current, generated);
        const added = merged.length - current.length;

        dispatch(
            updateLumoUserSettingsWithAutoSave({
                memories: merged,
                memoryPromptsSinceAutoSave: 0,
            })
        );

        return added;
    };

// Thunk to save Lumo user settings to remote API
export const saveLumoUserSettingsToRemote = createAsyncThunk<void, LumoUserSettings, { extra: LumoThunkArguments }>(
    'lumoUserSettings/saveToRemote',
    async (lumoUserSettings, { extra, getState }) => {
        const { lumoApi } = extra;
        const state = getState() as any;
        const masterKey = state.credentials?.masterKey;

        if (!masterKey) {
            throw new Error('Master key not available');
        }

        try {
            // Convert base64 master key to CryptoKey
            const masterKeyCrypto = await base64ToMasterKey(masterKey);
            const userSettingsToApi = await serializeUserSettings(lumoUserSettings, masterKeyCrypto);

            // Check if user settings already exist to determine whether to POST or PUT
            try {
                const existingSettings = await lumoApi.getUserSettings();
                if (existingSettings) {
                    await lumoApi.putUserSettings(userSettingsToApi);
                } else {
                    await lumoApi.postUserSettings(userSettingsToApi);
                }
            } catch (getError) {
                // If we can't determine if settings exist, try POST first
                try {
                    await lumoApi.postUserSettings(userSettingsToApi);
                } catch (postError) {
                    // If POST fails, try PUT
                    await lumoApi.putUserSettings(userSettingsToApi);
                }
            }

            console.log('LumoUserSettingsThunks: Lumo user settings saved to remote API successfully');
        } catch (error) {
            console.error('Failed to save Lumo user settings to remote:', error);
            throw error;
        }
    }
);

// Thunk to load Lumo user settings from remote API
export const loadLumoUserSettingsFromRemote = createAsyncThunk<
    LumoUserSettings | null,
    void,
    { extra: LumoThunkArguments }
>('lumoUserSettings/loadFromRemote', async (_, { extra, getState }) => {
    const { lumoApi } = extra;
    const state = getState() as any;
    const masterKey = state.credentials?.masterKey;

    if (!masterKey) {
        throw new Error('Master key not available');
    }

    try {
        const serializedUserSettings = await lumoApi.getUserSettings();
        console.log('LumoUserSettingsThunks: Raw encrypted payload received from API:', serializedUserSettings);
        if (serializedUserSettings) {

            // Convert base64 master key to CryptoKey
            const masterKeyCrypto = await base64ToMasterKey(masterKey);

            const userSettings = await deserializeUserSettings(serializedUserSettings, masterKeyCrypto);

            if (userSettings) {
                const isCoreProtonSettings = 'Email' in userSettings && 'Phone' in userSettings;
                const isLumoSettings = 'theme' in userSettings && 'personalization' in userSettings;

                if (isCoreProtonSettings) {
                    return null;
                } else if (isLumoSettings) {
                    console.log('LumoUserSettingsThunks: Got correct Lumo settings, returning as-is');
                    return userSettings;
                } else {
                    console.log('LumoUserSettingsThunks: Unknown settings format, returning null');
                    return null;
                }
            } else {
                console.log('LumoUserSettingsThunks: Deserialization returned null/undefined');
            }
        } else {
            console.log('LumoUserSettingsThunks: No serialized user settings received from API');
        }
        return null;
    } catch (error) {
        safeLogger.error('Failed to load Lumo user settings from remote:', error);
        safeLogger.error('Error details:', error);
        throw error;
    }
});
