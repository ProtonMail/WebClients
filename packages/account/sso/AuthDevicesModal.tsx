import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { useErrorHandler, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import {
    AbstractAuthDevicesModal,
    type AbstractAuthDevicesModalProps,
    type BaseAbstractAuthDevicesModalProps,
} from './AbstractAuthDeviceModal';
import { confirmPendingAuthDevice, rejectAuthDevice } from './authDeviceActions';
import type { AuthDevicesState } from './authDevices';

export const AuthDevicesModal = (props: BaseAbstractAuthDevicesModalProps) => {
    const [loading, withLoading] = useLoading();
    const dispatch = baseUseDispatch<ThunkDispatch<AuthDevicesState, ProtonThunkArguments, Action>>();
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();

    const handleConfirm: AbstractAuthDevicesModalProps['onConfirm'] = async ({
        pendingAuthDevice,
        confirmationCode,
    }) => {
        if (loading) {
            return;
        }
        try {
            await dispatch(
                confirmPendingAuthDevice({
                    pendingAuthDevice,
                    confirmationCode,
                })
            );
            createNotification({ text: c('sso').t`Sign-in confirmed` });
            props.onClose?.();
        } catch (e) {
            errorHandler(e);
        }
    };

    const handleReject: AbstractAuthDevicesModalProps['onReject'] = async (pendingAuthDevice) => {
        dispatch(rejectAuthDevice({ pendingAuthDevice, type: 'reject' })).catch(noop);
        createNotification({ text: c('sso').t`Sign-in rejected` });
        props.onClose?.();
    };

    return (
        <AbstractAuthDevicesModal
            {...props}
            loading={loading}
            onReject={handleReject}
            onConfirm={(data) => withLoading(handleConfirm(data))}
        />
    );
};
