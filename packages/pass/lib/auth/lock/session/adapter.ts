import { c } from 'ttag';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { type LockAdapter, LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthService } from '@proton/pass/lib/auth/service';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import {
    checkSessionLock,
    createSessionLock,
    deleteSessionLock,
    forceSessionLock,
    unlockSession,
} from './lock.requests';

export const sessionLockAdapterFactory = (auth: AuthService): LockAdapter => {
    const { authStore, api, onNotification } = auth.config;

    const adapter: LockAdapter = {
        type: LockMode.SESSION,

        /** Calling this function when a lock is registered and active
         * will extend the lock by resetting the ttl server-side. Set the
         * lock extend time regardless of the result of the API call in
         * order for clients to be able to lock even when offline. */
        check: async () => {
            logger.info(`[SessionLock] checking session lock`);

            authStore.setLockLastExtendTime(getEpoch());
            const lock = await checkSessionLock();

            authStore.setLocked(lock.locked);
            authStore.setLockTTL(lock.ttl);

            /* another client may have mutated the API lock */
            if (authStore.getLockMode() !== lock.mode) {
                authStore.setLockMode(lock.mode);

                if (lock.mode === LockMode.NONE) {
                    authStore.setLockToken(undefined);
                    await auth.config.onLockUpdate?.(lock, authStore.getLocalID(), true);
                    await auth.persistSession().catch(noop);
                }

                if (lock.mode === LockMode.SESSION) {
                    await auth.lock(adapter.type, { broadcast: true, soft: true });
                }
            }

            return lock;
        },

        /** Creates a session lock. Automatically updates the authentication
         * store and immediately persists the session on success. */
        create: async ({ secret, ttl }, onBeforeCreate) => {
            await onBeforeCreate?.();

            logger.info(`[SessionLock] creating session lock`);
            const token = await createSessionLock(secret, ttl);

            authStore.setLockToken(token);
            authStore.setLockTTL(ttl);
            authStore.setLockLastExtendTime(getEpoch());
            authStore.setLocked(false);
            authStore.setLockMode(adapter.type);

            await auth.persistSession().catch(noop);

            return { mode: adapter.type, locked: false, ttl };
        },

        /** Deletes a registered session lock. Requires the session lock code.
         * Immediately persists the session on success. */
        delete: async (secret) => {
            logger.info(`[SessionLock] deleting session lock`);
            await deleteSessionLock(secret);

            authStore.setLockToken(undefined);
            authStore.setLockTTL(undefined);
            authStore.setLockLastExtendTime(undefined);
            authStore.setLocked(false);
            authStore.setLockMode(LockMode.NONE);

            await auth.persistSession().catch(noop);
            return { mode: LockMode.NONE, locked: false };
        },

        lock: async (options) => {
            logger.info(`[SessionLock] locking session`);
            const sessionLocked = authStore.getLocked();
            const shouldLockSession = !sessionLocked && !options?.soft;

            if (shouldLockSession) await forceSessionLock().catch(noop);

            authStore.setLockToken(undefined);
            authStore.setLockLastExtendTime(undefined);
            authStore.setLocked(true);
            authStore.setLockMode(adapter.type);

            return { mode: adapter.type, locked: true };
        },

        unlock: async (secret: string) => {
            logger.info(`[SessionLock] unlocking session`);
            await api.reset();

            const currentToken = authStore.getLockToken();
            const currentMode = authStore.getLockMode();

            const token = await unlockSession(secret).catch(async (error) => {
                /** When unlocking the session, if the lock was unregistered by
                 * another client we will hit a 400 status-code with the 300008 response
                 * code. At this point we can login the user without requiring unlock.
                 * FIXME: BE should reply a custom error code. */
                const { code, status } = getApiError(error);
                if (code === PassErrorCode.SESSION_LOCKED && status === 400) {
                    onNotification?.({
                        key: NotificationKey.LOCK,
                        text: c('Error').t`Your PIN code was removed by another ${PASS_APP_NAME} client`,
                        type: 'error',
                    });

                    authStore.setLocked(false);
                    authStore.setLockLastExtendTime(undefined);
                    authStore.setLockMode(LockMode.NONE);
                    authStore.setLockTTL(undefined);

                    return undefined;
                }

                throw error;
            });

            authStore.setLockToken(token);
            authStore.setLockMode(LockMode.SESSION);

            /** session may be partially hydrated when unlocking  */
            const validSession = authStore.validSession(authStore.getSession());
            const shouldPersist = validSession && (currentToken !== token || currentMode !== LockMode.SESSION);
            if (shouldPersist) await auth.persistSession().catch(noop);

            return token;
        },
    };

    return adapter;
};
