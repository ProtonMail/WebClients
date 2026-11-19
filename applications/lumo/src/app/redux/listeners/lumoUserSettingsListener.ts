import { matchDarkTheme, setLumoSettings, userSettingsToLocalSettings } from '../../providers';
import { safeLogger } from '../../util/safeLogger';
import { mergeUserSettingsChanges } from '../../util/userSettingsMerge';
import { loadUserSettingsFromStorage, saveUserSettingsToStorage } from '../../util/userSettingsStorage';
import { selectMasterKey, selectMasterKeysBundle } from '../selectors';
import { addMasterKey } from '../slices/core/credentials';
import { updateFeatureFlags } from '../slices/featureFlags';
import type { LumoUserSettings } from '../slices/lumoUserSettings';
import {
    loadLumoUserSettingsFromRemote,
    resetLumoUserSettings,
    saveLumoUserSettingsToRemote,
    setLumoUserSettings,
    updateLumoUserSettings,
    updateLumoUserSettingsWithAutoSave,
} from '../slices/lumoUserSettings';
import { refreshLumoUserSettings } from '../slices/lumoUserSettingsActions';
import { USER_SETTINGS_NEED_KEY_MIGRATION, setUserSettingsMergeBase } from '../slices/lumoUserSettingsThunks';
import type { SaveLumoUserSettingsResult } from '../slices/lumoUserSettingsThunks';
import { setLumoUserSettingsBootstrapped, setRemoteUserSettingsLoadFailed } from '../slices/meta/initialization';
import { updatePersonalizationSettings } from '../slices/personalization';
import type { AppStartListening, LumoDispatch, LumoState } from '../store';

const SAVE_DEBOUNCE_MS = 1000;
const SAVE_RETRY_MS = 30_000;

/**
 * Start Lumo user settings-related listeners
 */
export function startLumoUserSettingsListeners(startListening: AppStartListening) {
    // Save Lumo user settings changes to encrypted localStorage and sync theme localStorage (for all changes)
    startListening({
        predicate: (action) =>
            updateLumoUserSettings.match(action) ||
            updateLumoUserSettingsWithAutoSave.match(action) ||
            resetLumoUserSettings.match(action) ||
            setLumoUserSettings.match(action) ||
            (loadLumoUserSettingsFromRemote.fulfilled.match(action) && action.meta.arg !== 'migration'),
        effect: async (_, listenerApi) => {
            const state = listenerApi.getState();
            const masterKey = selectMasterKey(state);
            const lumoUserSettings = state.lumoUserSettings;

            if (lumoUserSettings?.theme) {
                const systemIsDark = matchDarkTheme().matches;
                const localSettings = userSettingsToLocalSettings(lumoUserSettings, systemIsDark);
                setLumoSettings({
                    ...localSettings,
                    ...(lumoUserSettings.animatedBackgroundEnabled !== undefined && {
                        animatedBackgroundEnabled: lumoUserSettings.animatedBackgroundEnabled,
                    }),
                    ...(lumoUserSettings.animatedBackgroundBlobMode !== undefined && {
                        animatedBackgroundBlobMode: lumoUserSettings.animatedBackgroundBlobMode,
                    }),
                });
            }

            if (masterKey && lumoUserSettings) {
                await saveUserSettingsToStorage(lumoUserSettings, masterKey);
            }
        },
    });

    // Auto-save to remote API only for explicit auto-save actions (like theme changes). Only the keys those actions
    // changed are sent, applied to the server's latest copy (see `saveLumoUserSettingsToRemote`), so a device holding
    // defaults or stale settings can't overwrite the rest.
    let pendingChanges: Partial<LumoUserSettings> = {};
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let saveInFlight = false;
    let refreshRequested = false;
    let refreshController: AbortController | undefined;

    type SaveListenerApi = { dispatch: LumoDispatch; getState: () => LumoState };

    // A refresh replaces the snapshot used to compute local edits, so apply it only when the save queue is idle.
    const refreshWhenIdle = async (listenerApi: SaveListenerApi): Promise<void> => {
        const { dispatch, getState } = listenerApi;
        if (
            !refreshRequested ||
            refreshController ||
            saveInFlight ||
            saveTimer ||
            !getState().initialization.lumoUserSettingsBootstrapped
        ) {
            return;
        }
        refreshRequested = false;
        const controller = new AbortController();
        refreshController = controller;
        try {
            await dispatch(loadLumoUserSettingsFromRemote('background', { signal: controller.signal }));
        } finally {
            refreshController = undefined;
        }
        // An event may have arrived while this request was running.
        await refreshWhenIdle(listenerApi);
    };

    startListening({
        actionCreator: refreshLumoUserSettings,
        effect: async (_, listenerApi) => {
            refreshRequested = true;
            await refreshWhenIdle(listenerApi);
        },
    });

    /**
     * Brings local state up to date with what was just saved, which can include changes from other devices. The save
     * moved the merge base to `merged`; local state must follow, or the next save would read items missing locally
     * (but present in the base) as deleted here. Changes made while the save ran are rebased onto `merged`, in state
     * and in `pendingChanges`, so they keep what other devices added.
     */
    const rebaseOnSavedSettings = (
        { dispatch, getState }: SaveListenerApi,
        { merged, base }: SaveLumoUserSettingsResult
    ) => {
        const rebased = mergeUserSettingsChanges(base, pendingChanges, merged);
        pendingChanges = Object.fromEntries(
            Object.keys(pendingChanges).map((key) => [key, rebased[key as keyof LumoUserSettings]])
        );
        // The prompt counter is counted on this device and may have moved while the save ran.
        rebased.memoryPromptsSinceAutoSave = getState().lumoUserSettings.memoryPromptsSinceAutoSave;
        dispatch(updateLumoUserSettings(rebased));
        // Keep the slices that mirror these settings in sync, as a remote load does. A server copy written by another
        // client may lack these keys.
        if (rebased.personalization) {
            dispatch(updatePersonalizationSettings(rebased.personalization));
        }
        if (Array.isArray(rebased.featureFlags)) {
            dispatch(updateFeatureFlags(rebased.featureFlags));
        }
    };

    const scheduleRemoteSave = (listenerApi: SaveListenerApi, delay: number) => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
            saveTimer = undefined;
            // One save at a time: two concurrent read-modify-writes would drop each other's changes.
            if (saveInFlight) {
                scheduleRemoteSave(listenerApi, SAVE_DEBOUNCE_MS);
                return;
            }
            const changes: Partial<LumoUserSettings> = {
                ...pendingChanges,
                // The prompt counter changes without auto-save, so send this device's value along with every save,
                // as whole-object saves used to; otherwise the server copy, and every reload, would reset it.
                memoryPromptsSinceAutoSave: listenerApi.getState().lumoUserSettings.memoryPromptsSinceAutoSave,
            };
            const hadChanges = Object.keys(pendingChanges).length > 0;
            pendingChanges = {};
            if (!hadChanges) {
                return;
            }

            saveInFlight = true;
            try {
                const result = await listenerApi.dispatch(saveLumoUserSettingsToRemote(changes)).unwrap();
                console.log('LumoUserSettingsListener: Remote API save successful');
                rebaseOnSavedSettings(listenerApi, result);
            } catch (error) {
                // Keep the changes (newer ones win) and try again later.
                pendingChanges = { ...changes, ...pendingChanges };
                if (error === USER_SETTINGS_NEED_KEY_MIGRATION) {
                    const migration = await listenerApi.dispatch(loadLumoUserSettingsFromRemote('migration'));
                    const delay = loadLumoUserSettingsFromRemote.fulfilled.match(migration)
                        ? SAVE_DEBOUNCE_MS
                        : SAVE_RETRY_MS;
                    scheduleRemoteSave(listenerApi, delay);
                } else {
                    console.error('Failed to auto-save Lumo user settings to remote API:', error);
                    if (!saveTimer) {
                        scheduleRemoteSave(listenerApi, SAVE_RETRY_MS);
                    }
                }
            } finally {
                saveInFlight = false;
                void refreshWhenIdle(listenerApi);
            }
        }, delay);
    };

    startListening({
        matcher: (action) => updateLumoUserSettingsWithAutoSave.match(action),
        effect: async (action, listenerApi) => {
            console.log('LumoUserSettingsListener: Auto-save to remote API triggered', action.type, action.payload);
            if (!selectMasterKey(listenerApi.getState())) {
                console.log('LumoUserSettingsListener: No master key available for remote save');
                return;
            }
            pendingChanges = { ...pendingChanges, ...action.payload };
            scheduleRemoteSave(listenerApi, SAVE_DEBOUNCE_MS);
            if (refreshController) {
                refreshRequested = true;
                refreshController.abort();
            }
        },
    });

    // Load Lumo user settings from encrypted localStorage and remote API when master key becomes available
    startListening({
        actionCreator: addMasterKey,
        effect: async (action, listenerApi) => {
            const masterKeysBundle = selectMasterKeysBundle(listenerApi.getState());

            if (!masterKeysBundle) {
                listenerApi.dispatch(setLumoUserSettingsBootstrapped());
                return;
            }

            try {
                // First try to load from remote API (this should take precedence)
                let loadedFromRemote = false;
                try {
                    console.log('LumoUserSettingsListener: Attempting to load from remote API');
                    const result = await listenerApi.dispatch(loadLumoUserSettingsFromRemote()).unwrap();
                    console.log('LumoUserSettingsListener: Remote API load result:', result);
                    loadedFromRemote = result !== null;
                } catch (error) {
                    safeLogger.warn('Failed to load Lumo user settings from remote API:', error);
                    listenerApi.dispatch(setRemoteUserSettingsLoadFailed(true));
                }

                // If remote API failed or returned undecryptable data, fallback to localStorage
                if (!loadedFromRemote) {
                    const { userSettings: storedUserSettings, needsMasterKeyMigration } =
                        await loadUserSettingsFromStorage(masterKeysBundle);
                    console.log('LumoUserSettingsListener: Loaded from localStorage:', storedUserSettings);

                    if (storedUserSettings) {
                        console.log(
                            'LumoUserSettingsListener: Stored user settings keys:',
                            Object.keys(storedUserSettings)
                        );
                        console.log(
                            'LumoUserSettingsListener: Is core Proton settings:',
                            'Email' in storedUserSettings && 'Phone' in storedUserSettings
                        );
                        console.log(
                            'LumoUserSettingsListener: Is Lumo settings:',
                            'theme' in storedUserSettings && 'personalization' in storedUserSettings
                        );

                        // Check if this is core Proton settings and reject it
                        if ('Email' in storedUserSettings && 'Phone' in storedUserSettings) {
                            console.log(
                                'LumoUserSettingsListener: WARNING - Found core Proton settings in localStorage, ignoring them'
                            );
                            return;
                        }

                        // The server copy didn't load into state, so use the local copy. Don't gate this on
                        // the theme: it's restored from unencrypted localStorage at startup, so it isn't
                        // 'auto' for anyone who picked Light or Dark, and their settings stayed on defaults.
                        console.log('LumoUserSettingsListener: Setting Lumo user settings from localStorage');
                        listenerApi.dispatch(setLumoUserSettings(storedUserSettings));
                        // Memories in this copy may have been deleted elsewhere since; as the merge base they
                        // aren't mistaken for additions and written back.
                        setUserSettingsMergeBase(storedUserSettings);

                        if (needsMasterKeyMigration) {
                            try {
                                console.log(
                                    'LumoUserSettingsListener: Re-wrapping local user settings with primary master key'
                                );
                                // Local only: the remote copy didn't load, so pushing this one could
                                // overwrite newer settings. The remote blob is re-wrapped when it loads.
                                await saveUserSettingsToStorage(storedUserSettings, masterKeysBundle.primaryMasterKey);
                            } catch (error) {
                                safeLogger.warn(
                                    'Failed to re-wrap local user settings with primary master key:',
                                    error
                                );
                            }
                        }
                    }
                }

                // Personalization data will be synced by the personalization listener when it loads
            } catch (error) {
                safeLogger.error('Failed to load Lumo user settings from storage:', error);
            } finally {
                listenerApi.dispatch(setLumoUserSettingsBootstrapped());
                void refreshWhenIdle(listenerApi);
            }
        },
    });

    // Sync personalization data when loaded from remote (theme sync is handled by main listener above)
    startListening({
        actionCreator: loadLumoUserSettingsFromRemote.fulfilled,
        effect: async (action, listenerApi) => {
            if (action.meta.arg === 'migration') {
                return;
            }
            const lumoUserSettings = action.payload;
            if (lumoUserSettings) {
                setUserSettingsMergeBase(lumoUserSettings);
            }
            console.log('LumoUserSettingsListener: loadLumoUserSettingsFromRemote.fulfilled', lumoUserSettings);

            // The server answered, so an earlier load failure is no longer current: don't let the
            // toast show it if it hasn't been shown yet.
            const { remoteUserSettingsLoadFailed, remoteUserSettingsUndecryptable } =
                listenerApi.getState().initialization;
            if (remoteUserSettingsLoadFailed && !remoteUserSettingsUndecryptable) {
                listenerApi.dispatch(setRemoteUserSettingsLoadFailed(false));
            }

            if (lumoUserSettings && lumoUserSettings.personalization) {
                console.log(
                    'LumoUserSettingsListener: Syncing personalization from remote',
                    lumoUserSettings.personalization
                );
                listenerApi.dispatch(updatePersonalizationSettings(lumoUserSettings.personalization));
            } else {
                console.log('LumoUserSettingsListener: No personalization data found in Lumo user settings:', {
                    hasLumoUserSettings: !!lumoUserSettings,
                    hasPersonalization: !!(lumoUserSettings && lumoUserSettings.personalization),
                    lumoUserSettingsKeys: lumoUserSettings ? Object.keys(lumoUserSettings) : 'no lumoUserSettings',
                });
            }

            if (lumoUserSettings && lumoUserSettings.featureFlags) {
                console.log(
                    'LumoUserSettingsListener: Syncing featureFlags from remote',
                    lumoUserSettings.featureFlags
                );
                listenerApi.dispatch(updateFeatureFlags(lumoUserSettings.featureFlags));
            } else {
                console.log('LumoUserSettingsListener: No featureFlags data found in Lumo user settings:', {
                    hasLumoUserSettings: !!lumoUserSettings,
                    hasFeatureFlags: !!(lumoUserSettings && lumoUserSettings.featureFlags),
                    lumoUserSettingsKeys: lumoUserSettings ? Object.keys(lumoUserSettings) : 'no lumoUserSettings',
                });
            }
        },
    });

    // Also sync personalization data when Lumo user settings are set from localStorage
    startListening({
        actionCreator: setLumoUserSettings,
        effect: async (action, listenerApi) => {
            const lumoUserSettings = action.payload;
            console.log('LumoUserSettingsListener: setLumoUserSettings', lumoUserSettings);

            if (lumoUserSettings && lumoUserSettings.personalization) {
                console.log(
                    'LumoUserSettingsListener: Syncing personalization from localStorage',
                    lumoUserSettings.personalization
                );
                listenerApi.dispatch(updatePersonalizationSettings(lumoUserSettings.personalization));
            } else {
                console.log('LumoUserSettingsListener: No personalization data found in setLumoUserSettings:', {
                    hasLumoUserSettings: !!lumoUserSettings,
                    hasPersonalization: !!(lumoUserSettings && lumoUserSettings.personalization),
                    lumoUserSettingsKeys: lumoUserSettings ? Object.keys(lumoUserSettings) : 'no lumoUserSettings',
                });
            }

            if (lumoUserSettings && lumoUserSettings.featureFlags) {
                console.log(
                    'LumoUserSettingsListener: Syncing featureFlags from localStorage',
                    lumoUserSettings.featureFlags
                );
                listenerApi.dispatch(updateFeatureFlags(lumoUserSettings.featureFlags));
            } else {
                console.log('LumoUserSettingsListener: No featureFlags data found in setLumoUserSettings:', {
                    hasLumoUserSettings: !!lumoUserSettings,
                    hasFeatureFlags: !!(lumoUserSettings && lumoUserSettings.featureFlags),
                    lumoUserSettingsKeys: lumoUserSettings ? Object.keys(lumoUserSettings) : 'no lumoUserSettings',
                });
            }
        },
    });
}
