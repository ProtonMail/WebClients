import { createAsyncThunk } from '@reduxjs/toolkit';
import type { LumoThunkArguments } from '../thunk';
import type { LumoUserSettings } from './lumoUserSettings';
import { serializeUserSettings, deserializeUserSettings } from '../../serialization';
import { base64ToMasterKey } from '../../crypto';
import { safeLogger } from '../../util/safeLogger';

// Thunk to save Lumo user settings to remote API
export const saveLumoUserSettingsToRemote = createAsyncThunk<
    void,
    LumoUserSettings,
    { extra: LumoThunkArguments }
>(
    'lumoUserSettings/saveToRemote',
    async (lumoUserSettings, { extra, getState }) => {
        const { lumoApi } = extra;
        const state = getState() as any;
        const masterKey = state.credentials?.masterKey;
        
        console.log('LumoUserSettingsThunks: About to save Lumo user settings:', lumoUserSettings);
        console.log('LumoUserSettingsThunks: Lumo user settings keys:', Object.keys(lumoUserSettings || {}));
        console.log('LumoUserSettingsThunks: Has theme field:', 'theme' in (lumoUserSettings || {}));
        console.log('LumoUserSettingsThunks: Has personalization field:', 'personalization' in (lumoUserSettings || {}));
        
        if (!masterKey) {
            throw new Error('Master key not available');
        }

        try {
            // Convert base64 master key to CryptoKey
            const masterKeyCrypto = await base64ToMasterKey(masterKey);
            const userSettingsToApi = await serializeUserSettings(lumoUserSettings, masterKeyCrypto);
            console.log('LumoUserSettingsThunks: Encrypted payload being sent to API:', userSettingsToApi);
            
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
>(
    'lumoUserSettings/loadFromRemote',
    async (_, { extra, getState }) => {
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
                console.log('LumoUserSettingsThunks: About to decrypt with master key:', masterKey.substring(0, 20) + '...');
                
                // Convert base64 master key to CryptoKey
                const masterKeyCrypto = await base64ToMasterKey(masterKey);
                console.log('LumoUserSettingsThunks: Master key converted to CryptoKey');
                
                const userSettings = await deserializeUserSettings(serializedUserSettings, masterKeyCrypto);
                console.log('LumoUserSettingsThunks: Deserialization completed, result:', userSettings);
                
                if (userSettings) {
                    console.log('LumoUserSettingsThunks: Unencrypted payload loaded from API:', userSettings);
                    
                    // Display the decrypted payload in a more readable format
                    console.log('=== DECRYPTED LUMO USER SETTINGS PAYLOAD ===');
                    console.log('Full object:', JSON.stringify(userSettings, null, 2));
                    console.log('Personalization data:', userSettings.personalization);
                    console.log('Theme:', userSettings.theme);
                    console.log('All keys:', Object.keys(userSettings));
                    console.log('Type of userSettings:', typeof userSettings);
                    console.log('Is userSettings an object:', userSettings && typeof userSettings === 'object');
                    console.log('==========================================');
                    
                    // Check if this is core Proton user settings (has Email, Phone, etc.) or Lumo user settings (has theme, personalization)
                    const isCoreProtonSettings = 'Email' in userSettings && 'Phone' in userSettings;
                    const isLumoSettings = 'theme' in userSettings && 'personalization' in userSettings;
                    
                    console.log('LumoUserSettingsThunks: Is core Proton settings:', isCoreProtonSettings);
                    console.log('LumoUserSettingsThunks: Is Lumo settings:', isLumoSettings);
                    
                    if (isCoreProtonSettings) {
                        console.log('LumoUserSettingsThunks: WARNING - Got core Proton settings instead of Lumo settings!');
                        console.log('LumoUserSettingsThunks: This means we encrypted the wrong data. Returning null.');
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
    }
);
