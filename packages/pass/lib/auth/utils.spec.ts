import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { AppStatus } from '@proton/pass/types';

import { getInitialLockedAppStatus } from './utils';

type AuthStoreOverrides = {
    lockMode?: LockMode;
    encryptedOfflineKD?: string;
    hasOfflineComponents?: boolean;
};

const makeAuthStore = (overrides: AuthStoreOverrides = {}): AuthStore =>
    ({
        getLockMode: () => overrides.lockMode ?? LockMode.NONE,
        getEncryptedOfflineKD: () => overrides.encryptedOfflineKD,
        hasOfflineComponents: () => overrides.hasOfflineComponents ?? true,
    }) as unknown as AuthStore;

describe('getInitialLockedAppStatus', () => {
    test('returns undefined when no offline components', () => {
        const store = makeAuthStore({ hasOfflineComponents: false, lockMode: LockMode.PASSWORD });
        expect(getInitialLockedAppStatus(store, { offline: false, offlineEnabled: true })).toBeUndefined();
        expect(getInitialLockedAppStatus(store, { offline: true, offlineEnabled: true })).toBeUndefined();
    });

    test('returns undefined when offline and offline-mode disabled', () => {
        const store = makeAuthStore({ lockMode: LockMode.PASSWORD });
        expect(getInitialLockedAppStatus(store, { offline: true, offlineEnabled: false })).toBeUndefined();
    });

    describe('offline + offlineEnabled', () => {
        const params = { offline: true, offlineEnabled: true };

        test('BIOMETRICS with encryptedOfflineKD → BIOMETRICS_LOCKED', () => {
            const store = makeAuthStore({ lockMode: LockMode.BIOMETRICS, encryptedOfflineKD: 'kd' });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.BIOMETRICS_LOCKED);
        });

        test('BIOMETRICS without encryptedOfflineKD → PASSWORD_LOCKED', () => {
            const store = makeAuthStore({ lockMode: LockMode.BIOMETRICS });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.PASSWORD_LOCKED);
        });

        test('PASSWORD → PASSWORD_LOCKED', () => {
            const store = makeAuthStore({ lockMode: LockMode.PASSWORD });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.PASSWORD_LOCKED);
        });

        test('SESSION → PASSWORD_LOCKED (default branch offline fallback)', () => {
            const store = makeAuthStore({ lockMode: LockMode.SESSION });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.PASSWORD_LOCKED);
        });

        test('NONE → PASSWORD_LOCKED (default branch offline fallback)', () => {
            const store = makeAuthStore({ lockMode: LockMode.NONE });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.PASSWORD_LOCKED);
        });
    });

    describe('online', () => {
        const params = { offline: false, offlineEnabled: true };

        test('BIOMETRICS with encryptedOfflineKD → BIOMETRICS_LOCKED', () => {
            const store = makeAuthStore({ lockMode: LockMode.BIOMETRICS, encryptedOfflineKD: 'kd' });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.BIOMETRICS_LOCKED);
        });

        test('BIOMETRICS without encryptedOfflineKD → PASSWORD_LOCKED (password fallback)', () => {
            const store = makeAuthStore({ lockMode: LockMode.BIOMETRICS });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.PASSWORD_LOCKED);
        });

        test('PASSWORD → PASSWORD_LOCKED', () => {
            const store = makeAuthStore({ lockMode: LockMode.PASSWORD });
            expect(getInitialLockedAppStatus(store, params)).toBe(AppStatus.PASSWORD_LOCKED);
        });

        test('SESSION → undefined', () => {
            const store = makeAuthStore({ lockMode: LockMode.SESSION });
            expect(getInitialLockedAppStatus(store, params)).toBeUndefined();
        });

        test('NONE → undefined', () => {
            const store = makeAuthStore({ lockMode: LockMode.NONE });
            expect(getInitialLockedAppStatus(store, params)).toBeUndefined();
        });
    });
});
