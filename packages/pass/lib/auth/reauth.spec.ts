import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import { ExportFormat } from '@proton/pass/lib/export/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import createStore from '@proton/shared/lib/helpers/store';

import type { ReauthActionPayload } from './reauth';
import {
    ReauthAction,
    decryptReauthLock,
    encryptReauthLock,
    isLockChangeReauth,
    isOfflinePasswordReauth,
    resolveReauthKey,
} from './reauth';

describe('reauth helpers', () => {
    let authStore: AuthStore;

    beforeEach(() => {
        authStore = createAuthStore(createStore());
    });

    describe('isLockChangeReauth', () => {
        test('should return true for `BIOMETRICS_SETUP`', () => {
            const payload: ReauthActionPayload = {
                type: ReauthAction.BIOMETRICS_SETUP,
                data: { current: undefined, ttl: 3600 },
            };
            expect(isLockChangeReauth(payload)).toBe(true);
        });

        test('should return true for `PW_LOCK_SETUP`', () => {
            const payload: ReauthActionPayload = {
                type: ReauthAction.PW_LOCK_SETUP,
                data: { current: undefined, ttl: 3600 },
            };
            expect(isLockChangeReauth(payload)).toBe(true);
        });

        test('should return false for `OFFLINE_SETUP`', () => {
            const payload: ReauthActionPayload = { type: ReauthAction.OFFLINE_SETUP };
            expect(isLockChangeReauth(payload)).toBe(false);
        });

        test('should return false for `EXPORT_CONFIRM`', () => {
            const payload: ReauthActionPayload = {
                type: ReauthAction.EXPORT_CONFIRM,
                data: { format: ExportFormat.CSV, passphrase: '', fileAttachments: false, storageType: '' },
            };
            expect(isLockChangeReauth(payload)).toBe(false);
        });
    });

    describe('isOfflinePasswordReauth', () => {
        test('should return true for `BIOMETRICS_SETUP`', () => {
            const payload: ReauthActionPayload = {
                type: ReauthAction.BIOMETRICS_SETUP,
                data: { current: undefined, ttl: 3600 },
            };
            expect(isOfflinePasswordReauth(payload)).toBe(true);
        });

        test('should return true for `OFFLINE_SETUP`', () => {
            const payload: ReauthActionPayload = { type: ReauthAction.OFFLINE_SETUP };
            expect(isOfflinePasswordReauth(payload)).toBe(true);
        });

        test('should return true for `PW_LOCK_SETUP`', () => {
            const payload: ReauthActionPayload = {
                type: ReauthAction.PW_LOCK_SETUP,
                data: { current: undefined, ttl: 3600 },
            };
            expect(isOfflinePasswordReauth(payload)).toBe(true);
        });

        test('should return false for `EXPORT_CONFIRM`', () => {
            const payload: ReauthActionPayload = {
                type: ReauthAction.EXPORT_CONFIRM,
                data: { format: ExportFormat.CSV, passphrase: '', fileAttachments: false, storageType: '' },
            };
            expect(isOfflinePasswordReauth(payload)).toBe(false);
        });
    });

    describe('resolveReauthKey', () => {
        test('should derive key from session lock token and salt', async () => {
            const sessionLockToken = uniqueId(32);
            const getLockToken = jest.spyOn(authStore, 'getLockToken').mockReturnValue(sessionLockToken);
            const salt = crypto.getRandomValues(new Uint8Array(32));
            const key = await resolveReauthKey(authStore, salt);
            expect(getLockToken).toHaveBeenCalled();
            expect(key).toBeDefined();
            expect(key.algorithm.name).toEqual('AES-GCM');
        });

        test('should throw error when no session lock token available', async () => {
            const getLockToken = jest.spyOn(authStore, 'getLockToken').mockReturnValue(undefined);
            const salt = crypto.getRandomValues(new Uint8Array(32));
            await expect(resolveReauthKey(authStore, salt)).rejects.toThrow('Reauth key resolution failure');
            expect(getLockToken).toHaveBeenCalled();
        });
    });

    describe('encryptReauthLock', () => {
        test('should return payload unchanged when `current` is not defined', async () => {
            const payload = { current: undefined, ttl: 3600 };
            const result = await encryptReauthLock(payload, authStore);
            expect(result).toEqual(payload);
        });

        test('should encrypt payload when `current` is defined', async () => {
            const sessionLockToken = uniqueId(32);
            const getLockToken = jest.spyOn(authStore, 'getLockToken').mockReturnValue(sessionLockToken);
            const payload = { current: 'sensitive-data', ttl: 3600 };
            const result = await encryptReauthLock(payload, authStore);

            expect(getLockToken).toHaveBeenCalled();
            expect(result.ttl).toBe(3600);
            expect(result.current).not.toBe('sensitive-data');
            expect(result.current).toBeTruthy();

            const parsedData = JSON.parse(result.current!);
            expect(typeof parsedData.encrypted).toBe('string');
            expect(typeof parsedData.salt).toBe('string');
        });

        test('should encrypt and decrypt payload successfully', async () => {
            const sessionLockToken = uniqueId(32);
            const getLockToken = jest.spyOn(authStore, 'getLockToken').mockReturnValue(sessionLockToken);
            const payload = { current: 'sensitive-data', ttl: 3600 };
            const encrypted = await encryptReauthLock(payload, authStore);
            const decrypted = await decryptReauthLock(encrypted, authStore);

            expect(getLockToken).toHaveBeenCalledTimes(2);
            expect(decrypted.current).toEqual(payload.current);
            expect(decrypted.ttl).toEqual(payload.ttl);
        });
    });

    describe('decryptReauthLock', () => {
        test('should return payload unchanged when current is not defined', async () => {
            const payload = { current: undefined, ttl: 3600 };
            const result = await decryptReauthLock(payload, authStore);
            expect(result).toEqual(payload);
        });

        test('should decrypt previously encrypted payload', async () => {
            const sessionLockToken = uniqueId(32);
            const getLockToken = jest.spyOn(authStore, 'getLockToken').mockReturnValue(sessionLockToken);

            const originalData = 'confidential-information';
            const originalPayload = { current: originalData, ttl: 3600 };

            const encrypted = await encryptReauthLock(originalPayload, authStore);
            const decrypted = await decryptReauthLock(encrypted, authStore);

            expect(getLockToken).toHaveBeenCalledTimes(2);
            expect(decrypted.current).toBe(originalData);
            expect(decrypted.ttl).toBe(3600);
        });

        test('should throw error when session lock token is not available during decryption', async () => {
            const sessionLockToken = uniqueId(32);
            jest.spyOn(authStore, 'getLockToken').mockReturnValue(sessionLockToken);

            const originalPayload = { current: 'secret-data', ttl: 3600 };
            const encrypted = await encryptReauthLock(originalPayload, authStore);
            jest.spyOn(authStore, 'getLockToken').mockReturnValue(undefined);

            await expect(decryptReauthLock(encrypted, authStore)).rejects.toThrow('Reauth key resolution failure');
        });

        test('should fail to decrypt with wrong session lock token', async () => {
            jest.spyOn(authStore, 'getLockToken').mockReturnValue(uniqueId(32));
            const originalPayload = { current: 'secret-data', ttl: 3600 };
            const encrypted = await encryptReauthLock(originalPayload, authStore);

            jest.spyOn(authStore, 'getLockToken').mockReturnValue(uniqueId(32));
            await expect(decryptReauthLock(encrypted, authStore)).rejects.toThrow();
        });
    });
});
