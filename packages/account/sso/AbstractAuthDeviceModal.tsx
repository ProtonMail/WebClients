import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';
import noop from '@proton/utils/noop';

import AuthDeviceConfirmCodeInput from './AuthDeviceConfirmCodeInput';
import AuthDeviceItem from './AuthDeviceItem';
import ConfirmRejectAuthDevice from './ConfirmRejectAuthDevice';

export interface BaseAbstractAuthDevicesModalProps extends Omit<ModalProps<'div'>, 'children' | 'buttons'> {
    pendingAuthDevice: AuthDeviceOutput;
}

export interface AbstractAuthDevicesModalProps extends BaseAbstractAuthDevicesModalProps {
    loading: boolean;
    onConfirm: (data: { pendingAuthDevice: AuthDeviceOutput; confirmationCode: string }) => Promise<void>;
    onReject: (authDevice: AuthDeviceOutput) => Promise<void>;
}

export const AbstractAuthDevicesModal = ({
    pendingAuthDevice,
    loading,
    onConfirm,
    onReject,
    ...rest
}: AbstractAuthDevicesModalProps) => {
    const [confirmationCode, setConfirmationCode] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);

    const handleAccept = (confirmationCode: string) => {
        onConfirm({ pendingAuthDevice, confirmationCode }).catch(noop);
    };

    const handleReject = () => {
        onReject(pendingAuthDevice).catch(noop);
    };

    return (
        <>
            <ConfirmRejectAuthDevice
                open={rejectModalOpen}
                pendingAuthDevice={pendingAuthDevice}
                onConfirm={() => {
                    setRejectModalOpen(false);
                    handleReject();
                }}
                onClose={() => {
                    setRejectModalOpen(false);
                }}
            />
            <ModalTwo {...rest} size="small">
                <ModalTwoHeader title={c('sso').t`Sign-in requested on another device. Was it you?`} />
                <ModalTwoContent>
                    <div className="mb-2">{c('sso').t`Enter the confirmation code we sent on your other device.`}</div>
                    <div className="border border-weak rounded">
                        <AuthDeviceItem authDevice={pendingAuthDevice} />
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
                    <div>{c('sso').t`If you didn't make this request, cancel it now.`}</div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button
                        onClick={() => {
                            setRejectModalOpen(true);
                        }}
                    >{c('sso').t`No, it wasn’t me`}</Button>
                    <Button
                        color="norm"
                        loading={loading}
                        disabled={confirmationCode.length !== 4}
                        onClick={() => {
                            handleAccept(confirmationCode);
                        }}
                    >{c('sso').t`Yes, it was me`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};
