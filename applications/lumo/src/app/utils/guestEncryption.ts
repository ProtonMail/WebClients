/**
 * Guest data encryption utilities using Proton's shared crypto libraries
 * Provides temporary encryption for guest migration data without requiring user authentication
 */
import { decryptData, encryptData, exportKey, generateAndImportKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@proton/crypto/lib/utils';

import { GUEST_MIGRATION_STORAGE_KEYS } from '../constants/guestMigration';

/**
 * Generate a temporary encryption key for guest data using Proton crypto
 */
async function generateGuestEncryptionKey() {
    return generateAndImportKey(['encrypt', 'decrypt']);
}

/**
 * Store encryption key in sessionStorage (more secure than localStorage for keys)
 */
async function storeGuestEncryptionKey(key: CryptoKey): Promise<void> {
    const keyBytes = await exportKey(key);
    const keyBase64 = keyBytes.toBase64();
    sessionStorage.setItem(GUEST_MIGRATION_STORAGE_KEYS.ENCRYPTION_KEY, keyBase64);
}

/**
 * Retrieve encryption key from sessionStorage
 */
async function getGuestEncryptionKey(): Promise<CryptoKey | null> {
    try {
        const keyBase64 = sessionStorage.getItem(GUEST_MIGRATION_STORAGE_KEYS.ENCRYPTION_KEY);
        if (!keyBase64) return null;

        const keyBytes = Uint8Array.fromBase64(keyBase64);
        return await importKey(keyBytes, { keyUsage: ['encrypt', 'decrypt'], extractable: true });
    } catch (error) {
        console.error('Failed to retrieve guest encryption key:', error);
        return null;
    }
}

/**
 * Get or create encryption key for guest data
 */
async function getOrCreateGuestEncryptionKey(): Promise<CryptoKey> {
    let key = await getGuestEncryptionKey();
    if (!key) {
        key = await generateGuestEncryptionKey();
        await storeGuestEncryptionKey(key);
    }
    return key;
}

/**
 * Encrypt guest migration data using Proton's AES-GCM implementation
 */
export async function encryptGuestData(data: any): Promise<string> {
    try {
        const key = await getOrCreateGuestEncryptionKey();
        const jsonString = JSON.stringify(data);
        const dataBytes = utf8StringToUint8Array(jsonString);

        // Use Proton's encryptData which handles IV generation and formatting
        const encryptedBytes = await encryptData(key, dataBytes);

        // Convert to base64 for storage
        return encryptedBytes.toBase64();
    } catch (error) {
        console.error('Failed to encrypt guest data:', error);
        throw new Error('Guest data encryption failed');
    }
}

/**
 * Decrypt guest migration data using Proton's AES-GCM implementation
 */
export async function decryptGuestData(encryptedData: string): Promise<any> {
    try {
        const key = await getGuestEncryptionKey();
        if (!key) {
            throw new Error('No encryption key found');
        }

        // Convert from base64
        const encryptedBytes = Uint8Array.fromBase64(encryptedData);

        // Use Proton's decryptData which handles IV extraction and decryption
        const decryptedBytes = await decryptData(key, encryptedBytes);

        const jsonString = uint8ArrayToUtf8String(decryptedBytes);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to decrypt guest data:', error);
        throw new Error('Guest data decryption failed');
    }
}

/**
 * Clean up encryption key (call after successful migration)
 */
export function clearGuestEncryptionKey(): void {
    sessionStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.ENCRYPTION_KEY);
}
