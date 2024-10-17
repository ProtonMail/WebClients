import { c } from 'ttag';

import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    confirmPendingAuthDeviceRequest,
    getAuthDevicesRequest,
    rejectPendingAuthDeviceRequest,
} from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';
import { ConfirmAuthDeviceError } from '@proton/shared/lib/keys/deviceConfirm';

export const getAuthDevices = requestActionsFactory<void, AuthDeviceOutput[]>('auth::sso::auth_devices')({
    requestId: getAuthDevicesRequest,
});

export const confirmPendingAuthDevice = requestActionsFactory<
    { pendingAuthDevice: AuthDeviceOutput; confirmationCode: string },
    string
>('auth::sso::confirm')({
    requestId: ({ pendingAuthDevice }) => confirmPendingAuthDeviceRequest(pendingAuthDevice.ID),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('sso').t`Sign-in confirmed`,
            })({ payload }),
    },
    failure: {
        prepare: (error) =>
            withNotification(
                error instanceof ConfirmAuthDeviceError
                    ? { type: 'error', text: error.message, error: null }
                    : { type: 'error', text: c('sso').t`Sign-in failed`, error }
            )({ error, payload: null }),
    },
});

export const rejectPendingAuthDevice = requestActionsFactory<AuthDeviceOutput, string>('auth::sso::reject')({
    requestId: (pendingAuthDevice) => rejectPendingAuthDeviceRequest(pendingAuthDevice.ID),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('sso').t`Sign-in rejected`,
            })({ payload }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('sso').t`Sign-in rejection failure`,
                error,
            })({ error, payload: null }),
    },
});
