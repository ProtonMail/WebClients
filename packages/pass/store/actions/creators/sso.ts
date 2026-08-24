import { c } from 'ttag';

import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';
import { ConfirmAuthDeviceError } from '@proton/shared/lib/keys/deviceConfirm';

import { prop } from '../../../utils/fp/lens';
import { requestActionsFactory } from '../../request/flow';
import { withNotification } from '../enhancers/notification';

type ConfirmDeviceDTO = {
    pendingAuthDevice: AuthDeviceOutput;
    confirmationCode: string;
};

export const getAuthDevices = requestActionsFactory<void, AuthDeviceOutput[]>('auth::sso::auth_devices')();

export const confirmPendingAuthDevice = requestActionsFactory<ConfirmDeviceDTO, string>('auth::sso::confirm')({
    key: prop('pendingAuthDevice', 'ID'),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('sso').t`Sign-in confirmed`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification(
                error instanceof ConfirmAuthDeviceError
                    ? { type: 'error', text: error.message, error: null }
                    : { type: 'error', text: c('sso').t`Sign-in failed`, error }
            )({ error, payload }),
    },
});

export const rejectPendingAuthDevice = requestActionsFactory<AuthDeviceOutput, string>('auth::sso::reject')({
    key: prop('ID'),
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('sso').t`Sign-in rejected`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('sso').t`Sign-in rejection failure`,
                error,
            })({ error, payload }),
    },
});
