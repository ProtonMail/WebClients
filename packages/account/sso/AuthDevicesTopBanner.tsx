import { useEffect, useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { TopBanner, useModalState } from '@proton/components';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';
import noop from '@proton/utils/noop';

import { AuthDevicesModal } from './AuthDevicesModal';
import { type AuthDevicesState, authDevicesThunk, selectPendingAuthDevices } from './authDevices';

const AuthDevicesTopBanner = () => {
    const [modalProps, setModal, renderModal] = useModalState();
    const [tmpAuthDevice, setTmpAuthDevice] = useState<AuthDeviceOutput | null>(null);
    const { pendingActivations } = baseUseSelector(selectPendingAuthDevices);
    const dispatch = baseUseDispatch<ThunkDispatch<AuthDevicesState, ProtonThunkArguments, Action>>();

    useEffect(() => {
        dispatch(authDevicesThunk()).catch(noop);
    }, []);

    const pendingAuthDevice = tmpAuthDevice || pendingActivations?.[0];

    return (
        <>
            {renderModal && pendingAuthDevice && (
                <AuthDevicesModal
                    pendingAuthDevice={pendingAuthDevice}
                    {...modalProps}
                    onExit={() => {
                        setTmpAuthDevice(null);
                        modalProps.onExit();
                    }}
                />
            )}
            {Boolean(pendingAuthDevice) && (
                <TopBanner className="bg-warning">
                    {c('sso').t`Sign-in requested on another device. Was it you?`}{' '}
                    <InlineLinkButton
                        key="button"
                        onClick={() => {
                            setTmpAuthDevice(pendingAuthDevice);
                            setModal(true);
                        }}
                    >
                        {c('sso').t`Approve or deny it now`}
                    </InlineLinkButton>
                </TopBanner>
            )}
        </>
    );
};

export default AuthDevicesTopBanner;
