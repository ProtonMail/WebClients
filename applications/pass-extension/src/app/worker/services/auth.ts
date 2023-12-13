/* eslint-disable @typescript-eslint/no-throw-literal */
import { SSO_URL } from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import store from 'proton-pass-extension/app/worker/store';
import { c } from 'ttag';

import { AccountForkResponse, getAccountForkResponsePayload } from '@proton/pass/lib/auth/fork';
import {
    type AuthService,
    type AuthServiceConfig,
    createAuthService as createCoreAuthService,
} from '@proton/pass/lib/auth/service';
import type { SessionLock } from '@proton/pass/lib/auth/session-lock';
import { clientLocked, clientReady } from '@proton/pass/lib/client';
import type { MessageHandlerCallback } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { sessionUnlockFailure, sessionUnlockIntent, sessionUnlockSuccess } from '@proton/pass/store/actions';
import { selectUser } from '@proton/pass/store/selectors';
import type { WorkerMessageResponse } from '@proton/pass/types';
import { SessionLockStatus, WorkerMessageType } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp/lens';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { withContext } from '../context';

export const SESSION_LOCK_ALARM = 'alarm::session-lock';

export const createAuthService = (options: AuthServiceConfig): AuthService => {
    const authService = createCoreAuthService(options);

    const handleAccountFork = withContext<MessageHandlerCallback<WorkerMessageType.ACCOUNT_FORK>>(
        async ({ getState, service, status }, { payload }) => {
            if (getState().loggedIn) throw getAccountForkResponsePayload(AccountForkResponse.CONFLICT);

            try {
                await authService.consumeFork({ mode: 'secure', ...payload }, `${SSO_URL}/api`);
                if (clientLocked(status)) await service.storage.session.setItems(options.authStore.getSession());
                return getAccountForkResponsePayload(AccountForkResponse.SUCCESS);
            } catch (error: unknown) {
                authService.logout({ soft: true }).catch(noop);
                const additionalMessage = error instanceof Error ? error.message : '';

                options.onNotification?.(c('Warning').t`Unable to sign in to ${PASS_APP_NAME}. ${additionalMessage}`);

                throw getAccountForkResponsePayload(AccountForkResponse.ERROR, error);
            }
        }
    );

    const handleUnlockRequest = (request: { pin: string }) =>
        new Promise<WorkerMessageResponse<WorkerMessageType.UNLOCK_REQUEST>>((resolve) => {
            store.dispatch(
                sessionUnlockIntent({ pin: request.pin }, (action) => {
                    if (sessionUnlockSuccess.match(action)) return resolve({ ok: true });
                    if (sessionUnlockFailure.match(action)) return resolve({ ok: false, ...action.payload });
                })
            );
        });

    /* only extend the session lock if a lock is registered and we've reached at least 50%
     * of the lock TTL since the last extension. Calling `AuthService::syncLock` will extend
     * the lock via the `checkSessionLock` call */
    const handleActivityProbe = withContext<MessageHandlerCallback<WorkerMessageType.ACTIVITY_PROBE>>(
        async ({ status }) => {
            const registeredLock = options.authStore.getLockStatus() === SessionLockStatus.REGISTERED;
            const ttl = options.authStore.getLockTTL();

            if (clientReady(status) && registeredLock && ttl) {
                const now = getEpoch();
                const diff = now - (options.authStore.getLockLastExtendTime() ?? 0);
                if (diff > ttl * 0.5) await authService.checkLock();
            }

            return true;
        }
    );

    const resolveUserData = () => ({ user: selectUser(store.getState()) });

    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, handleAccountFork);
    WorkerMessageBroker.registerMessage(WorkerMessageType.UNLOCK_REQUEST, withPayload(handleUnlockRequest));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACTIVITY_PROBE, handleActivityProbe);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_USER_DATA, resolveUserData);
    browser.alarms.onAlarm.addListener(({ name }) => name === SESSION_LOCK_ALARM && authService.lock({ soft: false }));

    return authService;
};
/** Removes any session lock extension alarm */
export const clearSessionLockAlarm = () => browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);

/** Syncs the the session lock externsion alarm based on the lock type */
export const syncSessionLockAlarm = async (lock: SessionLock) => {
    try {
        const { ttl, status } = lock;
        await clearSessionLockAlarm();

        if (status === SessionLockStatus.REGISTERED && ttl) {
            const when = (getEpoch() + ttl) * 1_000;
            browser.alarms
                .clear(SESSION_LOCK_ALARM)
                .then(() => browser.alarms.create(SESSION_LOCK_ALARM, { when }))
                .catch(noop);
        }
    } catch {}
};
