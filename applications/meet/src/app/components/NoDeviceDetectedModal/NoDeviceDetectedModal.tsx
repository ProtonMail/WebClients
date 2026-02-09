import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    PermissionPromptStatus,
    selectNoDeviceDetected,
    setNoDeviceDetected,
} from '@proton/meet/store/slices/uiStateSlice';

import './NoDeviceDetectedModal.scss';

export const NoDeviceDetectedModal = () => {
    const dispatch = useMeetDispatch();
    const noDeviceDetected = useMeetSelector(selectNoDeviceDetected);

    if (noDeviceDetected === PermissionPromptStatus.CLOSED) {
        return null;
    }

    const deviceContentType = noDeviceDetected === PermissionPromptStatus.CAMERA ? 'see' : 'hear';

    const deviceNameBasedLabel =
        noDeviceDetected === PermissionPromptStatus.CAMERA
            ? c('Info').t`Check your system settings to make sure that a camera is available.`
            : c('Info').t`Check your system settings to make sure that a microphone is available.`;

    const continueWithoutDeviceLabel =
        noDeviceDetected === PermissionPromptStatus.CAMERA
            ? c('Action').t`Continue without camera`
            : c('Action').t`Continue without microphone`;

    return (
        <ModalTwo
            open={true}
            onClose={() => {
                dispatch(setNoDeviceDetected(PermissionPromptStatus.CLOSED));
            }}
            rootClassName="no-device-available-backdrop"
            className="no-device-available-modal border border-norm"
        >
            <ModalTwoHeader />
            <ModalTwoContent className="flex flex-column justify-center gap-4 text-center ">
                <div className="text-3xl text-semibold my-2">{c('Info')
                    .t`Do you want people to ${deviceContentType} you in the meeting?`}</div>

                <div className="color-weak mb-8">{deviceNameBasedLabel}</div>

                <Button
                    className="ignore-no-device-available-button text-bold color-primary w-full rounded-full text-semibold"
                    shape="ghost"
                    onClick={() => dispatch(setNoDeviceDetected(PermissionPromptStatus.CLOSED))}
                >
                    {continueWithoutDeviceLabel}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};
