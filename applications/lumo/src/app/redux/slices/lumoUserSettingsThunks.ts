import { createAsyncThunk } from '@reduxjs/toolkit';

import { deserializeUserSettingsWithMasterKeys, serializeUserSettings } from '../../serialization';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { mergeAppendedGeneratedMemories, normalizeMemories } from '../../util/memoryHelpers';
import { safeLogger } from '../../util/safeLogger';
import { mergeUserSettingsChanges } from '../../util/userSettingsMerge';
import { saveUserSettingsToStorage } from '../../util/userSettingsStorage';
import { selectMasterKeysBundle } from '../selectors';
import type { LumoDispatch, LumoState } from '../store';
import type { LumoThunkArguments } from '../thunk';
import { updateLumoUserSettingsWithAutoSave } from './lumoUserSettingsActions';
import type { LumoUserSettings, Memory } from './lumoUserSettingsTypes';
import { setRemoteUserSettingsLoadFailed, setRemoteUserSettingsUndecryptable } from './meta/initialization';

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

/**
 * The settings this device's state started from: the last copy loaded from or saved to the server,
 * or the local copy when the server copy didn't load. The merge compares local changes against it,
 * so items missing locally count as deleted only if this device actually had them. Undefined when
 * the device started from defaults, which limits the merge to additions.
 */
let mergeBaseUserSettings: LumoUserSettings | undefined;

export const setUserSettingsMergeBase = (userSettings: LumoUserSettings) => {
    mergeBaseUserSettings = userSettings;
};

// The server keeps the same tag on PUT. Only the first observed unreadable ciphertext can be the pre-reset blob.
// Null closes this recovery path once a readable copy appears or the ciphertext changes.
const preResetSettingsBlobs = new WeakMap<LumoThunkArguments['lumoApi'], string | null>();

const canReplaceUndecryptableSettings = (
    lumoApi: LumoThunkArguments['lumoApi'],
    encrypted: string,
    recoveryWarningShown: boolean,
    dispatch: (
        action:
            | ReturnType<typeof setRemoteUserSettingsUndecryptable>
            | ReturnType<typeof setRemoteUserSettingsLoadFailed>
    ) => unknown
) => {
    const previous = preResetSettingsBlobs.get(lumoApi);
    if (previous === encrypted && recoveryWarningShown) {
        return true;
    }
    if (previous !== encrypted) {
        preResetSettingsBlobs.set(lumoApi, previous === undefined ? encrypted : null);
    }
    dispatch(setRemoteUserSettingsUndecryptable(true));
    dispatch(setRemoteUserSettingsLoadFailed(true));
    return false;
};

/**
 * Saves `changes` to the remote API by applying them to the server's latest copy, not by sending
 * this device's whole state. That state can be defaults (a failed load) or stale (another device
 * saved since), and a whole-object PUT would overwrite every other setting with it.
 */
export type SaveLumoUserSettingsResult = {
    /** What was saved: the changes merged into the server copy. */
    merged: LumoUserSettings;
    /** The merge base the changes were compared against, before this save replaced it with `merged`. */
    base: LumoUserSettings | undefined;
};

export const USER_SETTINGS_NEED_KEY_MIGRATION = 'user-settings-need-key-migration';

export const saveLumoUserSettingsToRemote = createAsyncThunk<
    SaveLumoUserSettingsResult,
    Partial<LumoUserSettings>,
    { extra: LumoThunkArguments; rejectValue: typeof USER_SETTINGS_NEED_KEY_MIGRATION }
>('lumoUserSettings/saveToRemote', async (changes, { extra, getState, dispatch, rejectWithValue }) => {
    const { lumoApi } = extra;
    const state = getState() as LumoState;
    const masterKeysBundle = selectMasterKeysBundle(state);

    if (!masterKeysBundle) {
        throw new Error('Master key not available');
    }

    try {
        const masterKeys = await buildMasterKeyContext(masterKeysBundle);

        // Throws if the request fails: without the server's copy there is nothing safe to apply
        // the changes to, so the caller keeps them and retries.
        const serializedUserSettings = await lumoApi.getUserSettings();

        let serverCopy: LumoUserSettings = state.lumoUserSettings;
        if (serializedUserSettings) {
            const { userSettings: remoteUserSettings, needsMasterKeyMigration } =
                await deserializeUserSettingsWithMasterKeys(serializedUserSettings, masterKeys);
            if (
                !remoteUserSettings &&
                !canReplaceUndecryptableSettings(
                    lumoApi,
                    serializedUserSettings.encrypted,
                    (getState() as LumoState).initialization.lumoDataLossWarningShown,
                    dispatch
                )
            ) {
                throw new Error('Remote user settings could not be decrypted and are protected from replacement');
            }
            if (remoteUserSettings && 'theme' in remoteUserSettings && 'personalization' in remoteUserSettings) {
                // Let the load flow re-wrap the old copy before applying any of the queued edits.
                if (needsMasterKeyMigration) {
                    return rejectWithValue(USER_SETTINGS_NEED_KEY_MIGRATION);
                }
                serverCopy = remoteUserSettings;
            }
        }

        const nextUserSettings = mergeUserSettingsChanges(mergeBaseUserSettings, changes, serverCopy);
        const userSettingsToApi = await serializeUserSettings(nextUserSettings, masterKeys.primary);
        if (serializedUserSettings) {
            await lumoApi.putUserSettings(userSettingsToApi);
        } else {
            await lumoApi.postUserSettings(userSettingsToApi);
        }
        const base = mergeBaseUserSettings;
        mergeBaseUserSettings = nextUserSettings;
        preResetSettingsBlobs.set(lumoApi, null);
        if ((getState() as LumoState).initialization.remoteUserSettingsUndecryptable) {
            dispatch(setRemoteUserSettingsUndecryptable(false));
        }
        dispatch(setRemoteUserSettingsLoadFailed(false));

        console.log('LumoUserSettingsThunks: Lumo user settings saved to remote API successfully');
        return { merged: nextUserSettings, base };
    } catch (error) {
        console.error('Failed to save Lumo user settings to remote:', error);
        throw error;
    }
});

// Thunk to load Lumo user settings from remote API
export const loadLumoUserSettingsFromRemote = createAsyncThunk<
    LumoUserSettings | null,
    'background' | 'migration' | void,
    { extra: LumoThunkArguments }
>('lumoUserSettings/loadFromRemote', async (mode, { extra, getState, dispatch, signal }) => {
    const { lumoApi } = extra;
    const state = getState() as LumoState;
    const masterKeysBundle = selectMasterKeysBundle(state);

    if (!masterKeysBundle) {
        throw new Error('Master key not available');
    }

    try {
        const serializedUserSettings = await lumoApi.getUserSettings();
        if (signal.aborted) {
            return null;
        }
        if (serializedUserSettings) {
            const { primary: primaryMasterKey, legacy } = await buildMasterKeyContext(masterKeysBundle);

            const { userSettings, needsMasterKeyMigration } = await deserializeUserSettingsWithMasterKeys(
                serializedUserSettings,
                { primary: primaryMasterKey, legacy }
            );
            if (signal.aborted) {
                return null;
            }

            if (userSettings) {
                // We got something decryptable, so whatever earlier undecryptable state we were in
                // no longer applies — it's now safe to save again.
                dispatch(setRemoteUserSettingsUndecryptable(false));
                preResetSettingsBlobs.set(lumoApi, null);

                const isCoreProtonSettings = 'Email' in userSettings && 'Phone' in userSettings;
                const isLumoSettings = 'theme' in userSettings && 'personalization' in userSettings;

                if (isCoreProtonSettings) {
                    return null;
                } else if (isLumoSettings) {
                    console.log('LumoUserSettingsThunks: Got correct Lumo settings, returning as-is');
                    if (needsMasterKeyMigration && mode !== 'background') {
                        try {
                            console.log('LumoUserSettingsThunks: Re-wrapping user settings with primary master key');
                            const userSettingsToApi = await serializeUserSettings(userSettings, primaryMasterKey);
                            await lumoApi.putUserSettings(userSettingsToApi);
                            if (mode !== 'migration') {
                                await saveUserSettingsToStorage(userSettings, masterKeysBundle.primaryMasterKey);
                            }
                        } catch (error) {
                            if (mode === 'migration') {
                                throw error;
                            }
                            safeLogger.warn('Failed to re-wrap user settings with primary master key:', error);
                        }
                    }
                    // A migration requested by the save queue leaves the local snapshot and its merge base intact.
                    return mode === 'migration' ? null : userSettings;
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
                canReplaceUndecryptableSettings(
                    lumoApi,
                    serializedUserSettings.encrypted,
                    (getState() as LumoState).initialization.lumoDataLossWarningShown,
                    dispatch
                );
            }
        } else {
            console.log('LumoUserSettingsThunks: No serialized user settings received from API');
            dispatch(setRemoteUserSettingsUndecryptable(false));
        }
        return null;
    } catch (error) {
        if (signal.aborted) {
            throw error;
        }
        safeLogger.error('Failed to load Lumo user settings from remote:', error);
        safeLogger.error('Error details:', error);
        throw error;
    }
});
