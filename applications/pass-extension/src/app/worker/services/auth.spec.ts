import WorkerMessageBroker from 'proton-pass-extension/__mocks__/app/worker/channel';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context/types';
import { createAuthService } from 'proton-pass-extension/app/worker/services/auth';
import * as permissionUtils from 'proton-pass-extension/lib/utils/permissions';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore } from '@proton/pass/lib/auth/store';
import type { Api } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import createStore from '@proton/shared/lib/helpers/store';

jest.mock('proton-pass-extension/lib/utils/permissions');
const permissions = permissionUtils as jest.MockedObject<typeof permissionUtils>;

describe('Extension AuthService', () => {
    let api: Api;
    let authStore: AuthStore;

    beforeEach(() => {
        jest.clearAllMocks();
        api = jest.fn() as unknown as Api;
        api.subscribe = jest.fn();
        authStore = createAuthStore(createStore());
        WorkerContext.set({} as WorkerContextInterface);
    });

    afterEach(() => {
        WorkerContext.clear();
        jest.clearAllMocks();
    });

    describe('Extension AuthService factory', () => {
        let auth: AuthService;

        beforeEach(() => {
            auth = createAuthService(api, authStore);
        });

        test('should setup service', () => {
            expect(auth).toBeDefined();
            expect(api.subscribe).toHaveBeenCalled();
        });

        test.each([
            WorkerMessageType.ACCOUNT_PROBE,
            WorkerMessageType.ACCOUNT_FORK,
            WorkerMessageType.AUTH_CHECK,
            WorkerMessageType.AUTH_CONFIRM_PASSWORD,
            WorkerMessageType.AUTH_INIT,
            WorkerMessageType.AUTH_UNLOCK,
        ])('should register `%s` handler', (message) => {
            expect(WorkerMessageBroker.registerMessage).toHaveBeenCalledWith(message, expect.any(Function));
        });
    });

    describe('onResumeStart hook', () => {
        let auth: AuthService;

        beforeEach(() => {
            auth = createAuthService(api, authStore);
            auth.config.onSessionEmpty = jest.fn();
            auth.config.onSessionFailure = jest.fn();
            auth.config.onNotification = jest.fn();
        });

        test('should proceed when permissions are available', async () => {
            permissions.hasHostPermissions.mockResolvedValueOnce(true);
            const result = await auth.config.onResumeStart?.({ hasSession: true });

            expect(result).toBe(true);
            expect(auth.config.onSessionEmpty).not.toHaveBeenCalled();
            expect(auth.config.onSessionFailure).not.toHaveBeenCalled();
        });

        test('should handle missing permissions with no session', async () => {
            permissions.hasHostPermissions.mockResolvedValueOnce(false);
            const result = await auth.config.onResumeStart?.({ hasSession: false });

            expect(result).toBe(false);
            expect(auth.config.onSessionEmpty).toHaveBeenCalled();
            expect(auth.config.onNotification).toHaveBeenCalledWith({
                type: 'error',
                key: NotificationKey.EXT_PERMISSIONS,
                text: '',
            });
        });

        test('should handle missing permissions with existing session', async () => {
            permissions.hasHostPermissions.mockResolvedValueOnce(false);
            const result = await auth.config.onResumeStart?.({ hasSession: true });

            expect(result).toBe(false);
            expect(auth.config.onSessionFailure).toHaveBeenCalledWith({ retryable: false });
            expect(auth.config.onNotification).toHaveBeenCalledWith({
                type: 'error',
                key: NotificationKey.EXT_PERMISSIONS,
                text: '',
            });
        });
    });
});
