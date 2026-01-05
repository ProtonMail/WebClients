import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import type { Api } from '@proton/pass/types';
import createStore from '@proton/shared/lib/helpers/store';

import type { AuthService } from './service';
import { createAuthService } from './service';

describe('Core AuthService', () => {
    let api: Api;
    let authStore: AuthStore;

    beforeEach(() => {
        jest.clearAllMocks();
        api = jest.fn() as unknown as Api;
        api.subscribe = jest.fn();
        authStore = createAuthStore(createStore());
    });

    describe('AuthService::resumeSession', () => {
        let auth: AuthService;

        beforeEach(() => {
            auth = createAuthService({
                api,
                authStore,
                onInit: jest.fn(),
                getPersistedSession: jest.fn(() => Promise.resolve(null)),
                getMemorySession: jest.fn(() => Promise.resolve(null)),
            });
        });

        test('should halt resume when `onResumeStart` returns `false`', async () => {
            auth = createAuthService({
                api,
                authStore,
                onInit: jest.fn(),
                getPersistedSession: jest.fn(() => Promise.resolve(null)),
                getMemorySession: jest.fn(() => Promise.resolve(null)),
                onResumeStart: jest.fn(() => Promise.resolve(false)),
            });

            const result = await auth.resumeSession(0, {});

            expect(result).toBe(false);
            expect(auth.config.onResumeStart).toHaveBeenCalledWith({ hasSession: false });
        });

        test('should proceed when `onResumeStart` returns `true`', async () => {
            auth = createAuthService({
                api,
                authStore,
                getMemorySession: jest.fn(() => Promise.resolve({ LocalID: 0 })),
                getPersistedSession: jest.fn(() => Promise.resolve(null)),
                onInit: jest.fn(),
                onResumeStart: jest.fn(() => Promise.resolve(true)),
            });

            /** Simulate in-memory session to proceed */
            jest.spyOn(auth, 'login').mockResolvedValueOnce(true);
            jest.spyOn(authStore, 'validSession').mockReturnValueOnce(true);
            const result = await auth.resumeSession(0, {});

            expect(result).toBe(true);
            expect(auth.config.onResumeStart).toHaveBeenCalledWith({ hasSession: true });
        });
    });
});
