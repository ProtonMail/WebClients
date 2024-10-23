import { useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import {
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Time,
    useErrorHandler,
    useNotifications,
} from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { useEffectOnce, useLoading } from '@proton/hooks';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getValidActivation } from '@proton/shared/lib/keys/device';
import noop from '@proton/utils/noop';

import { getMemberAddresses } from '../members';
import AuthDeviceConfirmCodeInput from './AuthDeviceConfirmCodeInput';
import { IconItem, getAuthDevicePlatformIcon, getAuthDevicePlatformIconComponent } from './AuthDeviceItem';
import ConfirmDenyMemberAuthDevice from './ConfirmDenyMemberAuthDevice';
import { confirmPendingMemberAuthDevice, rejectMemberAuthDevice } from './memberAuthDeviceActions';
import type { MemberAuthDevicesState, PendingAdminActivation } from './memberAuthDevices';

interface Props extends Omit<ModalProps<'div'>, 'children' | 'buttons'> {
    pendingMemberAuthDevice: PendingAdminActivation;
}

const MemberAuthDevicesModal = ({ pendingMemberAuthDevice, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const dispatch = baseUseDispatch<ThunkDispatch<MemberAuthDevicesState, ProtonThunkArguments, Action>>();
    const { createNotification } = useNotifications();
    const [confirmationCode, setConfirmationCode] = useState('');
    const errorHandler = useErrorHandler();
    const [rejectModalOpen, setRejectModalOpen] = useState(false);

    useEffectOnce(() => {
        dispatch(getMemberAddresses({ member: pendingMemberAuthDevice.member, retry: true })).catch(noop);
    }, []);

    const handleAccept = (confirmationCode: string) => {
        if (loading) {
            return;
        }
        withLoading(
            dispatch(
                confirmPendingMemberAuthDevice({
                    pendingMemberAuthDevice,
                    confirmationCode,
                })
            )
        )
            .then(() => {
                createNotification({ text: c('sso').t`Access granted` });
                rest.onClose?.();
            })
            .catch(errorHandler);
    };

    const handleReject = () => {
        dispatch(
            rejectMemberAuthDevice({
                memberID: pendingMemberAuthDevice.member.ID,
                memberAuthDevice: pendingMemberAuthDevice.memberAuthDevice,
                type: 'reject',
            })
        ).catch(noop);
        createNotification({ text: c('sso').t`Access denied` });
        rest.onClose?.();
    };

    const { member, memberAuthDevice } = pendingMemberAuthDevice;
    const activation = getValidActivation({ addresses: member.Addresses || [], pendingAuthDevice: memberAuthDevice });
    const memberAddress = activation?.address.Email || '';
    const boldedMemberAddress = (
        <span key="member-address" className="text-bold text-break">
            {memberAddress}
        </span>
    );

    return (
        <>
            <ConfirmDenyMemberAuthDevice
                open={rejectModalOpen}
                pendingMemberAuthDevice={pendingMemberAuthDevice}
                onConfirm={async () => {
                    setRejectModalOpen(false);
                    handleReject();
                }}
                onClose={() => {
                    setRejectModalOpen(false);
                }}
            />
            <ModalTwo {...rest} size="small">
                <ModalTwoHeader title={c('sso').t`Grant access to user?`} />
                <ModalTwoContent>
                    <div className="mb-4">
                        {c('sso')
                            .jt`${boldedMemberAddress} is requesting your help to sign in to their ${BRAND_NAME} Account with single sign-on.`}
                    </div>
                    <div className="text-bold mb-2">
                        {c('sso').t`Enter the confirmation code we sent to this user.`}
                    </div>
                    <div className="my-6">
                        <AuthDeviceConfirmCodeInput
                            value={confirmationCode}
                            onValue={setConfirmationCode}
                            onSubmit={(value) => {
                                handleAccept(value);
                            }}
                        />
                    </div>
                    <div className="mb-4">
                        {c('sso').t`User details:`}
                        <div className="border border-weak rounded mb-4">
                            <IconItem
                                padding={true}
                                icon={getAuthDevicePlatformIconComponent('user')}
                                title={member.Name}
                                info={
                                    <>
                                        {c('sso').t`Tried to sign in at`}{' '}
                                        <Time>{memberAuthDevice.LastActivityTime}</Time>
                                    </>
                                }
                            />
                            <hr className="border-weak border-bottom m-0" />
                            <IconItem
                                padding={true}
                                icon={getAuthDevicePlatformIconComponent(getAuthDevicePlatformIcon(memberAuthDevice))}
                                title={memberAuthDevice.Name}
                                info={memberAuthDevice.LocalizedClientName}
                            />
                        </div>
                    </div>
                    <Card rounded>
                        <Icon name="info-circle" className="align-text-top" />{' '}
                        {c('sso')
                            .t`This will sign the user out of their other devices and they will have to create a new backup password.`}
                    </Card>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button
                        onClick={() => {
                            setRejectModalOpen(true);
                        }}
                    >{c('sso').t`Deny access`}</Button>
                    <Button
                        color="norm"
                        loading={loading}
                        disabled={confirmationCode.length !== 4}
                        onClick={() => {
                            handleAccept(confirmationCode);
                        }}
                    >{c('sso').t`Grant access`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default MemberAuthDevicesModal;
