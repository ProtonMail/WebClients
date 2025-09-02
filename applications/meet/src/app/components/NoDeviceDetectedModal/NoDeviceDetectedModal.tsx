import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useUIStateContext } from '../../contexts/UIStateContext';
import { PermissionPromptStatus } from '../../types';

import './NoDeviceDetectedModal.scss';

export const NoDeviceDetectedModal = () => {
    const { noDeviceDetected, setNoDeviceDetected } = useUIStateContext();

    if (noDeviceDetected === PermissionPromptStatus.CLOSED) {
        return null;
    }

    const deviceName = noDeviceDetected === PermissionPromptStatus.CAMERA ? 'camera' : 'microphone';
    const deviceContentType = noDeviceDetected === PermissionPromptStatus.CAMERA ? 'see' : 'hear';

    return (
        <ModalTwo
            open={true}
            onClose={() => {
                setNoDeviceDetected(PermissionPromptStatus.CLOSED);
            }}
            rootClassName="no-device-available-backdrop"
            className="no-device-available-modal"
        >
            <ModalTwoHeader />
            <ModalTwoContent className="flex flex-column justify-center gap-4 text-center ">
                <div className="text-3xl text-semibold my-2">{c('meet_2025 Info')
                    .t`Do you want people to ${deviceContentType} you in the meeting?`}</div>

                <div className="color-weak mb-8">{c('meet_2025 Info')
                    .t`Check your system settings to make sure that a ${deviceName} is available.`}</div>

                <Button
                    className="ignore-no-device-available-button text-bold color-primary w-full rounded-full text-semibold"
                    shape="ghost"
                    onClick={() => setNoDeviceDetected(PermissionPromptStatus.CLOSED)}
                >
                    {c('meet_2025 Action').t`Continue without ${deviceName}`}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};
