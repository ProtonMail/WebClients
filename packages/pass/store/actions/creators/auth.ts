import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type SessionLockCheckResult } from '@proton/pass/lib/auth/session-lock';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { ExtensionEndpoint } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const signoutIntent = createAction('auth::signout::intent', (payload: { soft: boolean }) =>
    withCacheBlock({ payload })
);

export const signoutSuccess = createAction('auth::signout::success', (payload: { soft: boolean }) =>
    withCacheBlock({ payload })
);

export const sessionLockIntent = createAction('session::lock::intent', () => withCacheBlock({ payload: {} }));
export const sessionLockSync = createAction('session::lock::sync', (payload: SessionLockCheckResult) =>
    withCacheBlock({ payload })
);

export const sessionLockEnableIntent = createAction(
    'session::lock::enable::intent',
    withRequestStart((payload: { pin: string; ttl: number }) => withCacheBlock({ payload }))
);

export const sessionLockEnableFailure = createAction(
    'session::lock::enable::failure',
    withRequestFailure((error: unknown, endpoint?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                endpoint,
                text: c('Error').t`Auto-lock could not be activated`,
                error,
            })
        )({ payload: {}, error })
    )
);

export const sessionLockEnableSuccess = createAction(
    'session::lock::enable::success',
    withRequestSuccess((payload: { sessionLockToken: string; ttl: number }, endpoint?: ExtensionEndpoint) =>
        withNotification({
            type: 'info',
            endpoint,
            text: c('Info').t`PIN code successfully registered. Use it to unlock ${PASS_APP_NAME}`,
        })({ payload })
    )
);

export const sessionLockDisableIntent = createAction(
    'session::lock::disable::intent',
    withRequestStart((payload: { pin: string }) => withCacheBlock({ payload }))
);

export const sessionLockDisableFailure = createAction(
    'session::lock::disable::failure',
    withRequestFailure((error: unknown, endpoint?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                endpoint,
                text: c('Error').t`Auto-lock could not be disabled`,
                error,
            })
        )({ payload: {}, error })
    )
);

export const sessionLockDisableSuccess = createAction(
    'session::lock::disable::success',
    withRequestSuccess((endpoint?: ExtensionEndpoint) =>
        withNotification({
            type: 'info',
            endpoint,
            text: c('Info').t`Auto-lock successfully disabled`,
        })({ payload: {} })
    )
);

export const sessionUnlockIntent = createAction(
    'session::unlock::intent',
    withRequestStart(
        (
            payload: { pin: string },
            callback?: ActionCallback<ReturnType<typeof sessionUnlockSuccess> | ReturnType<typeof sessionUnlockFailure>>
        ) => pipe(withCacheBlock, withCallback(callback))({ payload })
    )
);

export const sessionUnlockFailure = createAction(
    'session::unlock::failure',
    withRequestFailure((error: unknown, payload: { error: string; canRetry: boolean }) =>
        pipe(withCacheBlock, withNotification({ type: 'error', text: payload.error, error }))({ payload, error })
    )
);

export const sessionUnlockSuccess = createAction(
    'session::unlock::success',
    withRequestSuccess((payload: { sessionLockToken: string }) => withCacheBlock({ payload }))
);
