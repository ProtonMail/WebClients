import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { encryptPersistedSessionWithKey } from '@proton/pass/lib/auth/session';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import createStore from '@proton/shared/lib/helpers/store';

import * as lockRequests from './lock.requests';

jest.mock('./lock.requests');

const unlock = lockRequests.unlockSession as jest.Mock;

const setupAdapter = () => {
    const api = { reset: jest.fn() };
    const authStore = createAuthStore(createStore());
    const onNotification = jest.fn();
    const getPersistedSession = jest.fn();
    const persistSession = jest.fn();
    const onLockUpdate = jest.fn();
    const logout = jest.fn();
    const lock = jest.fn();

    const config = { api, authStore, onNotification, getPersistedSession };
    const auth = { persistSession, onLockUpdate, lock, logout };

    return {
        adapter: sessionLockAdapterFactory({ ...auth, config } as any),
        api,
        authStore,
        config,
    };
};

describe('SessionLock adapter', () => {
    describe('Factory', () => {
        test('Should set correct lock mode type', () => {
            const { adapter } = setupAdapter();
            expect(adapter.type).toEqual(LockMode.SESSION);
        });
    });

    describe('SessionLockAdapter::unlock', () => {
        const { adapter, authStore, config } = setupAdapter();
        const sessionLockToken = 'session-token-test';
        const keyPassword = 'keypassword-test';
        const session = { sessionLockToken, keyPassword } as any;

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('should resolve session lock token and ensure it matches with persisted token', async () => {
            unlock.mockResolvedValue(sessionLockToken);

            const clientKeyBytes = generateKey();
            const clientKey = await importKey(clientKeyBytes);
            const persistedSession = await encryptPersistedSessionWithKey(session, clientKey);

            config.getPersistedSession.mockResolvedValue(JSON.parse(persistedSession));
            authStore.setClientKey(clientKeyBytes.toBase64());
            authStore.setLockMode(LockMode.SESSION);

            const token = await adapter.unlock('123456');
            expect(token).toEqual(sessionLockToken);
        });

        test('should throw if session lock token does not match persisted token', async () => {
            unlock.mockResolvedValue('new-session-lock-token');

            const clientKeyBytes = generateKey();
            const clientKey = await importKey(clientKeyBytes);
            const persistedSession = await encryptPersistedSessionWithKey(session, clientKey);

            config.getPersistedSession.mockResolvedValue(JSON.parse(persistedSession));
            authStore.setClientKey(clientKeyBytes.toBase64());
            authStore.setLockMode(LockMode.SESSION);

            await expect(adapter.unlock('123456')).rejects.toThrow('Invalid session unlock response');
        });
    });
});
