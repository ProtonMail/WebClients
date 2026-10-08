import { createAsyncThunk } from '@reduxjs/toolkit';

import { base64ToMasterKey } from '../../crypto';
import { deserializeUserSettingsWithMasterKeys, serializeUserSettings } from '../../serialization';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { mergeAppendedGeneratedMemories, normalizeMemories } from '../../util/memoryHelpers';
import { safeLogger } from '../../util/safeLogger';
import { saveUserSettingsToStorage } from '../../util/userSettingsStorage';
import { selectMasterKey, selectMasterKeysBundle } from '../selectors';
import type { LumoDispatch, LumoState } from '../store';
import type { LumoThunkArguments } from '../thunk';
import { updateLumoUserSettingsWithAutoSave } from './lumoUserSettingsActions';
import type { LumoUserSettings, Memory } from './lumoUserSettingsTypes';
import { setRemoteUserSettingsUndecryptable } from './meta/initialization';

/**
 * Atomically merges `generated` into the latest persisted memories, resetting the
 * "prompts since last update" counter. Reading state inside the thunk avoids the race
 * where memories added or edited during a long-running generation get clobbered when the
 * caller persists a stale snapshot.
 *
 * Returns the number of newly added memories.
 */
export const appendGeneratedMemoriesThunk =
    (generated: Memory[], memoryLastProcessedMessageAt?: string) =>
    (dispatch: LumoDispatch, getState: () => LumoState): number => {
        const current = normalizeMemories(getState().lumoUserSettings.memories);
        const merged = mergeAppendedGeneratedMemories(current, generated);
        const added = merged.length - current.length;

        dispatch(
            updateLumoUserSettingsWithAutoSave({
                memories: merged,
                memoryPromptsSinceAutoSave: 0,
                ...(added > 0 && memoryLastProcessedMessageAt && { memoryLastProcessedMessageAt }),
            })
        );

        return added;
    };

// Thunk to save Lumo user settings to remote API
export const saveLumoUserSettingsToRemote = createAsyncThunk<void, LumoUserSettings, { extra: LumoThunkArguments }>(
    'lumoUserSettings/saveToRemote',
    async (lumoUserSettings, { extra, getState }) => {
        const { lumoApi } = extra;
        const state = getState() as LumoState;
        const masterKey = selectMasterKey(state);

        if (!masterKey) {
            throw new Error('Master key not available');
        }

        if (state.initialization.remoteUserSettingsUndecryptable) {
            // The remote blob exists but couldn't be decrypted with any key we have (see
            // `setRemoteUserSettingsUndecryptable`). Saving now would PUT the current (default)
            // settings over it, permanently destroying data that could still come back if the
            // user's old account keys are ever recovered through some other path. This is a brief
            // window, not a permanent lockout: `useDataLossWarningNotification` clears the flag as
            // soon as the user has been told their data is gone, at which point saves resume
            // normally. Until then, settings keep working locally for this session; they just
            // don't round-trip to the server.
            safeLogger.warn(
                'Skipping remote user settings save: existing remote blob is undecryptable and must not be overwritten'
            );
            return;
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (getError) {
                // If we can't determine if settings exist, try POST first
                try {
                    await lumoApi.postUserSettings(userSettingsToApi);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
>('lumoUserSettings/loadFromRemote', async (_, { extra, getState, dispatch }) => {
    const { lumoApi } = extra;
    const state = getState() as LumoState;
    const masterKeysBundle = selectMasterKeysBundle(state);

    if (!masterKeysBundle) {
        throw new Error('Master key not available');
    }

    try {
        const serializedUserSettings = await lumoApi.getUserSettings();
        console.log('LumoUserSettingsThunks: Raw encrypted payload received from API:', serializedUserSettings);
        if (serializedUserSettings) {
            const { primary: primaryMasterKey, legacy } = await buildMasterKeyContext(masterKeysBundle);

            const { userSettings, needsMasterKeyMigration } = await deserializeUserSettingsWithMasterKeys(
                serializedUserSettings,
                { primary: primaryMasterKey, legacy }
            );

            if (userSettings) {
                // We got something decryptable, so whatever earlier undecryptable state we were in
                // no longer applies — it's now safe to save again.
                dispatch(setRemoteUserSettingsUndecryptable(false));

                const isCoreProtonSettings = 'Email' in userSettings && 'Phone' in userSettings;
                const isLumoSettings = 'theme' in userSettings && 'personalization' in userSettings;

                if (isCoreProtonSettings) {
                    return null;
                } else if (isLumoSettings) {
                    console.log('LumoUserSettingsThunks: Got correct Lumo settings, returning as-is');
                    if (needsMasterKeyMigration) {
                        try {
                            console.log('LumoUserSettingsThunks: Re-wrapping user settings with primary master key');
                            const userSettingsToApi = await serializeUserSettings(userSettings, primaryMasterKey);
                            await lumoApi.putUserSettings(userSettingsToApi);
                            await saveUserSettingsToStorage(userSettings, masterKeysBundle.primaryMasterKey);
                        } catch (error) {
                            safeLogger.warn('Failed to re-wrap user settings with primary master key:', error);
                        }
                    }
                    return userSettings;
                } else {
                    console.log('LumoUserSettingsThunks: Unknown settings format, returning null');
                    return null;
                }
            } else {
                // A blob exists server-side but none of our master keys could decrypt it —
                // typically a password reset without data recovery minted a new master key (see
                // LUMO-853). The old keys might still come back through some other recovery path,
                // and the server never deletes the old envelope/blob, so guard against an
                // auto-save clobbering it until a future load actually succeeds.
                console.log('LumoUserSettingsThunks: Deserialization returned null/undefined');
                dispatch(setRemoteUserSettingsUndecryptable(true));
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
