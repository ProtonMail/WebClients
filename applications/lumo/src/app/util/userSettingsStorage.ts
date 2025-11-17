import { base64ToMasterKey } from '../crypto';
import type { LumoUserSettings } from '../redux/slices/lumoUserSettings';
import { deserializeUserSettings, serializeUserSettings } from '../serialization';
import { safeLogger } from './safeLogger';

const STORAGE_KEY_PREFIX = 'lumo-user-settings-encrypted';

/**
 * Get user-specific storage key - similar to LumoThemeProvider
 */
const getLocalID = (url = window.location.href): string | null => {
    try {
        const pathName = new URL(url).pathname;
        const match = pathName.match(/\/u\/(\d+)\//);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

/**
 * Get user-specific storage key
 */
const getUserSettingsStorageKey = (): string => {
    const localID = getLocalID();
    return localID ? `${STORAGE_KEY_PREFIX}:${localID}` : STORAGE_KEY_PREFIX;
};

/**
 * Save user settings to localStorage using master key encryption
 */
export async function saveUserSettingsToStorage(
    userSettings: LumoUserSettings,
    masterKeyBase64: string
): Promise<void> {
    try {
        // Convert master key to crypto key
        const masterKey = await base64ToMasterKey(masterKeyBase64);

        // Serialize and encrypt using the existing system
        const userSettingsToApi = await serializeUserSettings(userSettings, masterKey);

        // Store the encrypted data in localStorage with user-specific key
        console.log('debug: saving user settings to storage', userSettingsToApi);
        const storageKey = getUserSettingsStorageKey();
        console.log('debug: storage key', storageKey);
        localStorage.setItem(storageKey, userSettingsToApi.Encrypted);

        console.log('User settings saved to encrypted localStorage');
    } catch (error) {
        safeLogger.error('Failed to save user settings to storage:', error);
    }
}

/**
 * Load user settings from localStorage using master key decryption
 */
export async function loadUserSettingsFromStorage(masterKeyBase64: string): Promise<LumoUserSettings | null> {
    try {
        const storageKey = getUserSettingsStorageKey();
        const encryptedData = localStorage.getItem(storageKey);
        if (!encryptedData) {
            return null;
        }

        // Convert master key to crypto key
        const masterKey = await base64ToMasterKey(masterKeyBase64);

        // Create a serialized user settings object
        const serializedUserSettings = {
            userSettingsTag: 'user-settings-v1',
            encrypted: encryptedData,
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
        };

        // Deserialize using the existing system
        const userSettings = await deserializeUserSettings(serializedUserSettings, masterKey);

        if (userSettings) {
            console.log('User settings loaded from encrypted localStorage');
        }

        return userSettings;
    } catch (error) {
        safeLogger.warn('Failed to load user settings from storage:', error);
        return null;
    }
}

/**
 * Clear user settings from localStorage
 */
export function clearUserSettingsFromStorage(): void {
    const storageKey = getUserSettingsStorageKey();
    localStorage.removeItem(storageKey);
}
