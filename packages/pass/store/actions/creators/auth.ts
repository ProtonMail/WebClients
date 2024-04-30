import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type SessionLock } from '@proton/pass/lib/auth/session-lock';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { type ActionCallback, withCallback } from '@proton/pass/store/actions/enhancers/callback';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    sessionLockDisableRequest,
    sessionLockEnableRequest,
    sessionUnlockRequest,
} from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import type { ClientEndpoint } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const signoutIntent = createAction('auth::signout::intent', (payload: { soft: boolean }) => ({ payload }));
export const signoutSuccess = createAction('auth::signout::success', (payload: { soft: boolean }) => ({ payload }));

export const sessionLockIntent = createAction('session::lock::intent', () => ({ payload: {} }));
export const sessionLockSync = createAction('session::lock::sync', (payload: SessionLock) => ({ payload }));

export const sessionLockEnableIntent = createAction(
    'session::lock::enable::intent',
    (payload: { pin: string; ttl: number }) =>
        withRequest({ status: 'start', id: sessionLockEnableRequest() })({ payload })
);

export const sessionLockEnableFailure = createAction(
    'session::lock::enable::failure',
    withRequestFailure((error: unknown, endpoint?: ClientEndpoint) =>
        withNotification({
            key: NotificationKey.SESSION_LOCK,
            type: 'error',
            endpoint,
            text: c('Error').t`Auto-lock could not be activated`,
            error,
        })({ payload: {}, error })
    )
);

export const sessionLockEnableSuccess = createAction(
    'session::lock::enable::success',
    withRequestSuccess((payload: { sessionLockToken: string; ttl: number }, endpoint?: ClientEndpoint) =>
        pipe(
            withCache,
            withNotification({
                key: NotificationKey.SESSION_LOCK,
                type: 'info',
                endpoint,
                text: c('Info').t`PIN code successfully registered. Use it to unlock ${PASS_APP_NAME}`,
            })
        )({ payload })
    )
);

export const sessionLockDisableIntent = createAction('session::lock::disable::intent', (payload: { pin: string }) =>
    withRequest({ status: 'start', id: sessionLockDisableRequest() })({ payload })
);

export const sessionLockDisableFailure = createAction(
    'session::lock::disable::failure',
    withRequestFailure((error: unknown, endpoint?: ClientEndpoint) =>
        withNotification({
            key: NotificationKey.SESSION_LOCK,
            type: 'error',
            endpoint,
            text: c('Error').t`Auto-lock could not be disabled`,
            error,
        })({ payload: {}, error })
    )
);

export const sessionLockDisableSuccess = createAction(
    'session::lock::disable::success',
    withRequestSuccess((endpoint?: ClientEndpoint) =>
        pipe(
            withCache,
            withNotification({
                key: NotificationKey.SESSION_LOCK,
                type: 'info',
                endpoint,
                text: c('Info').t`Auto-lock successfully disabled`,
            })
        )({ payload: {} })
    )
);

export const sessionUnlockIntent = createAction(
    'session::unlock::intent',
    (
        payload: { pin: string },
        callback?: ActionCallback<ReturnType<typeof sessionUnlockSuccess> | ReturnType<typeof sessionUnlockFailure>>
    ) => pipe(withRequest({ status: 'start', id: sessionUnlockRequest() }), withCallback(callback))({ payload })
);

export const sessionUnlockFailure = createAction(
    'session::unlock::failure',
    withRequestFailure((error: unknown, payload: { error: string; canRetry: boolean }) =>
        withNotification({
            key: NotificationKey.SESSION_LOCK,
            type: 'error',
            text: payload.error,
            error,
        })({ payload, error })
    )
);

export const sessionUnlockSuccess = createAction(
    'session::unlock::success',
    withRequestSuccess((payload: { sessionLockToken: string }) => ({ payload }))
);
