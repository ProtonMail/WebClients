import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type Lock, type LockCreateDTO, LockMode, type UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { lockCreateRequest, unlockRequest } from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ClientEndpoint } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const signoutIntent = createAction('auth::signout::intent', (payload: { soft: boolean }) => ({ payload }));
export const signoutSuccess = createAction('auth::signout::success', (payload: { soft: boolean }) => ({ payload }));

export const lock = createAction('auth::lock', () => ({ payload: null }));
export const lockSync = createAction('auth::lock::sync', (lock: Lock) => ({ payload: { lock } }));

export const lockCreateIntent = createAction('auth::lock::create::intent', (lock: LockCreateDTO) =>
    pipe(
        withRequest({ status: 'start', id: lockCreateRequest(), data: true }),
        withNotification({
            key: NotificationKey.LOCK,
            loading: true,
            text: (() => {
                switch (lock.mode) {
                    case LockMode.NONE:
                        return c('Info').t`Disabling auto-lock`;
                    case LockMode.SESSION:
                        return c('Info').t`Enabling PIN auto-lock`;
                    case LockMode.PASSWORD:
                        return c('Info').t`Enabling password auto-lock`;
                }
            })(),
            type: 'info',
        })
    )({ payload: { lock } })
);

export const lockCreateFailure = createAction(
    'auth::lock::create::failure',
    withRequestFailure((mode: LockMode, error: unknown, endpoint?: ClientEndpoint) =>
        withNotification({
            endpoint,
            error,
            key: NotificationKey.LOCK,
            text: (() => {
                switch (mode) {
                    case LockMode.NONE:
                        return c('Info').t`Disabling auto-lock failed`;
                    case LockMode.SESSION:
                        return c('Info').t`Registering PIN lock failed`;
                    case LockMode.PASSWORD:
                        return c('Info').t`Enabling password lock failed`;
                }
            })(),
            type: 'error',
        })({ payload: {}, error })
    )
);

export const lockCreateSuccess = createAction(
    'auth::lock::create::success',
    withRequestSuccess((lock: Lock, endpoint?: ClientEndpoint) =>
        pipe(
            withCache,
            withSettings,
            withNotification({
                endpoint,
                key: NotificationKey.LOCK,
                text: (() => {
                    switch (lock.mode) {
                        case LockMode.NONE:
                            return c('Info').t`Auto-lock successfully disabled.`;
                        case LockMode.SESSION:
                            return c('Info').t`PIN code successfully registered. Use it to unlock ${PASS_APP_NAME}`;
                        case LockMode.PASSWORD:
                            return c('Info')
                                .t`Password lock successfully registered. Use it to unlock ${PASS_APP_NAME}`;
                    }
                })(),
                type: 'info',
            })
        )({ payload: { lock } })
    )
);

export const unlock = requestActionsFactory<UnlockDTO, LockMode, LockMode>('auth::unlock')({
    requestId: unlockRequest,
    failure: {
        prepare: (error, mode) =>
            withNotification({
                key: NotificationKey.LOCK,
                type: 'error',
                text: (() => {
                    switch (mode) {
                        case LockMode.SESSION:
                            if (error instanceof Error) {
                                if (error.name === 'LockedSession') return c('Error').t`Wrong PIN code. Try again.`;
                                if (error.name === 'InactiveSession') {
                                    return c('Error').t`Too many failed attempts. Please sign in again.`;
                                }
                            }
                        default:
                            return c('Error').t`Unlock failure`;
                    }
                })(),
                error,
            })({ payload: null, error }),
    },
});
