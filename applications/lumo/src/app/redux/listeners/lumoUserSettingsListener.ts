import { setLumoSettings } from '../../providers';
import { matchDarkTheme, userSettingsToLocalSettings } from '../../providers';
import { safeLogger } from '../../util/safeLogger';
import { loadUserSettingsFromStorage, saveUserSettingsToStorage } from '../../util/userSettingsStorage';
import { selectMasterKey } from '../selectors';
import { addMasterKey } from '../slices/core/credentials';
import { updateFeatureFlags } from '../slices/featureFlags';
import {
    loadLumoUserSettingsFromRemote,
    resetLumoUserSettings,
    saveLumoUserSettingsToRemote,
    setLumoUserSettings,
    updateLumoUserSettings,
    updateLumoUserSettingsWithAutoSave,
} from '../slices/lumoUserSettings';
import { updatePersonalizationSettings } from '../slices/personalization';
import type { AppStartListening } from '../store';

/**
 * Start Lumo user settings-related listeners
 */
export function startLumoUserSettingsListeners(startListening: AppStartListening) {
    // Save Lumo user settings changes to encrypted localStorage and sync theme localStorage (for all changes)
    startListening({
        matcher: (action) =>
            updateLumoUserSettings.match(action) ||
            updateLumoUserSettingsWithAutoSave.match(action) ||
            resetLumoUserSettings.match(action) ||
            setLumoUserSettings.match(action) ||
            loadLumoUserSettingsFromRemote.fulfilled.match(action),
        effect: async (action, listenerApi) => {
            const state = listenerApi.getState();
            const masterKey = selectMasterKey(state);

            if (masterKey) {
                const lumoUserSettings = state.lumoUserSettings;

                if (lumoUserSettings) {
                    // Save to encrypted localStorage
                    await saveUserSettingsToStorage(lumoUserSettings, masterKey);

                    // Also sync theme to unencrypted localStorage for theme system
                    if (lumoUserSettings.theme) {
                        const systemIsDark = matchDarkTheme().matches;
                        const localSettings = userSettingsToLocalSettings(lumoUserSettings, systemIsDark);
                        console.log('debug: LumoUserSettingsListener: Syncing theme to localStorage', {
                            action: action.type,
                            userSettings: lumoUserSettings,
                            localSettings,
                            systemIsDark,
                        });
                        setLumoSettings(localSettings);
                    }
                }
            }
        },
    });

    // Auto-save to remote API only for explicit auto-save actions (like theme changes)
    startListening({
        matcher: (action) => updateLumoUserSettingsWithAutoSave.match(action),
        effect: async (action, listenerApi) => {
            console.log('LumoUserSettingsListener: Auto-save to remote API triggered', action.type, action.payload);
            const state = listenerApi.getState();
            const masterKey = selectMasterKey(state);

            if (masterKey) {
                const lumoUserSettings = state.lumoUserSettings;
                console.log('LumoUserSettingsListener: Current lumoUserSettings state', lumoUserSettings);

                if (lumoUserSettings) {
                    // Save to remote API (debounced)
                    console.log('LumoUserSettingsListener: Scheduling remote API save in 1 second');
                    setTimeout(async () => {
                        try {
                            console.log('LumoUserSettingsListener: Executing remote API save', lumoUserSettings);
                            await listenerApi.dispatch(saveLumoUserSettingsToRemote(lumoUserSettings)).unwrap();
                            console.log('LumoUserSettingsListener: Remote API save successful');
                        } catch (error) {
                            console.error('Failed to auto-save Lumo user settings to remote API:', error);
                        }
                    }, 1000); // 1 second debounce
                } else {
                    console.log('LumoUserSettingsListener: No lumoUserSettings to save');
                }
            } else {
                console.log('LumoUserSettingsListener: No master key available for remote save');
            }
        },
    });

    // Load Lumo user settings from encrypted localStorage and remote API when master key becomes available
    startListening({
        actionCreator: addMasterKey,
        effect: async (action, listenerApi) => {
            const masterKey = action.payload;

            try {
                // First try to load from remote API (this should take precedence)
                let remoteLoadSuccess = false;
                try {
                    console.log('LumoUserSettingsListener: Attempting to load from remote API');
                    const result = await listenerApi.dispatch(loadLumoUserSettingsFromRemote()).unwrap();
                    console.log('LumoUserSettingsListener: Remote API load result:', result);
                    remoteLoadSuccess = true;
                } catch (error) {
                    safeLogger.warn('Failed to load Lumo user settings from remote API:', error);
                }

                // If remote API failed, fallback to localStorage
                if (!remoteLoadSuccess) {
                    const storedUserSettings = await loadUserSettingsFromStorage(masterKey);
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

                        // Only update if we don't already have user settings data
                        const currentLumoUserSettings = listenerApi.getState().lumoUserSettings;
                        let hasExistingData = false;

                        if (currentLumoUserSettings && typeof currentLumoUserSettings === 'object') {
                            hasExistingData = currentLumoUserSettings.theme !== 'auto';
                        }

                        if (!hasExistingData) {
                            console.log('LumoUserSettingsListener: Setting Lumo user settings from localStorage');
                            listenerApi.dispatch(setLumoUserSettings(storedUserSettings));
                        }
                    }
                }

                // Personalization data will be synced by the personalization listener when it loads
            } catch (error) {
                safeLogger.error('Failed to load Lumo user settings from storage:', error);
            }
        },
    });

    // Sync personalization data when loaded from remote (theme sync is handled by main listener above)
    startListening({
        actionCreator: loadLumoUserSettingsFromRemote.fulfilled,
        effect: async (action, listenerApi) => {
            const lumoUserSettings = action.payload;
            console.log('LumoUserSettingsListener: loadLumoUserSettingsFromRemote.fulfilled', lumoUserSettings);

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
