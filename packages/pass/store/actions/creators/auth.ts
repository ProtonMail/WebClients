import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type SessionLockCheckResult } from '@proton/pass/lib/auth/session-lock';
import { settingsEdit, unlockSession } from '@proton/pass/store/actions/requests';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest from '@proton/pass/store/actions/with-request';
import type { ExtensionEndpoint } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const signout = createAction('signout', (payload: { soft: boolean }) => withCacheBlock({ payload }));
export const signoutSuccess = createAction('signout success', (payload: { soft: boolean }) =>
    withCacheBlock({ payload })
);

export const sessionLock = createAction('session lock', () => withCacheBlock({ payload: {} }));
export const offlineLock = createAction('offline lock');
export const syncLock = createAction('sync lock', (payload: SessionLockCheckResult) => withCacheBlock({ payload }));

export const sessionLockEnableIntent = createAction('enable session lock', (payload: { pin: string; ttl: number }) =>
    pipe(
        withCacheBlock,
        withRequest({
            id: settingsEdit('session-lock'),
            type: 'start',
        })
    )({ payload })
);

export const sessionLockEnableFailure = createAction(
    'enable session lock failure',
    (error: unknown, receiver?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withRequest({ id: settingsEdit('session-lock'), type: 'failure' }),
            withNotification({
                type: 'error',
                receiver,
                text: c('Error').t`Auto-lock could not be activated`,
                error,
            })
        )({ payload: {}, error })
);

export const sessionLockEnableSuccess = createAction(
    'enable session lock success',
    (payload: { sessionLockToken: string; ttl: number }, receiver?: ExtensionEndpoint) =>
        pipe(
            withRequest({ id: settingsEdit('session-lock'), type: 'success' }),
            withNotification({
                type: 'info',
                receiver,
                text: c('Info').t`PIN code successfully registered. Use it to unlock ${PASS_APP_NAME}`,
            })
        )({ payload })
);

export const sessionLockDisableIntent = createAction('disable session lock', (payload: { pin: string }) =>
    pipe(
        withCacheBlock,
        withRequest({
            id: settingsEdit('session-lock'),
            type: 'start',
        })
    )({ payload })
);

export const sessionLockDisableFailure = createAction(
    'disable session lock failure',
    (error: unknown, receiver?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withRequest({ id: settingsEdit('session-lock'), type: 'failure' }),
            withNotification({
                type: 'error',
                receiver,
                text: c('Error').t`Auto-lock could not be disabled`,
                error,
            })
        )({ payload: {}, error })
);

export const sessionLockDisableSuccess = createAction('disable session lock success', (receiver?: ExtensionEndpoint) =>
    pipe(
        withRequest({ id: settingsEdit('session-lock'), type: 'success' }),
        withNotification({
            type: 'info',
            receiver,
            text: c('Info').t`Auto-lock successfully disabled`,
        })
    )({ payload: {} })
);

export const sessionUnlockIntent = createAction(
    'unlock session lock',
    (
        payload: { pin: string },
        callback?: ActionCallback<ReturnType<typeof sessionUnlockSuccess> | ReturnType<typeof sessionUnlockFailure>>
    ) =>
        pipe(
            withCacheBlock,
            withCallback(callback),
            withRequest({
                id: unlockSession,
                type: 'start',
            })
        )({ payload })
);

export const sessionUnlockFailure = createAction(
    'unlock session lock failure',
    (error: unknown, payload: { error: string; canRetry: boolean }) =>
        pipe(
            withCacheBlock,
            withRequest({ id: unlockSession, type: 'failure' }),
            withNotification({
                type: 'error',
                text: payload.error,
                error,
            })
        )({ payload, error })
);

export const sessionUnlockSuccess = createAction(
    'unlock session lock success',
    (payload: { sessionLockToken: string }) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: unlockSession,
                type: 'success',
            })
        )({ payload })
);
