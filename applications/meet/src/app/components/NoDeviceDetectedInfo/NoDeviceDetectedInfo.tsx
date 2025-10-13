import { useState } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { IcCross } from '@proton/icons';

import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { PermissionPromptStatus } from '../../types';

export const NoDeviceDetectedInfo = () => {
    const [isOpen, setIsOpen] = useState(true);

    const { noDeviceDetected, setNoDeviceDetected } = useUIStateContext();

    const { microphones, cameras } = useMediaManagementContext();

    const isLargerThanMd = useIsLargerThanMd();

    if (!isLargerThanMd) {
        return null;
    }

    const hasCamera = cameras.length > 0;
    const hasMicrophone = microphones.length > 0;

    const hasBothDevices = hasCamera && hasMicrophone;

    if (noDeviceDetected !== PermissionPromptStatus.CLOSED || !isOpen || hasBothDevices) {
        return null;
    }

    const microphoneLabel = c('Info').t`microphone`;
    const cameraLabel = c('Info').t`camera`;

    const microphoneLinkButton = !hasMicrophone && (
        <InlineLinkButton
            key="open-microphone-device-modal"
            className="color-primary mx-1"
            onClick={() => {
                setNoDeviceDetected(PermissionPromptStatus.MICROPHONE);
            }}
        >
            {microphoneLabel}
        </InlineLinkButton>
    );

    const cameraLinkButton = !hasCamera && (
        <InlineLinkButton
            key="open-camera-device-modal"
            className="color-primary mx-1"
            onClick={() => {
                setNoDeviceDetected(PermissionPromptStatus.CAMERA);
            }}
        >
            {cameraLabel}
        </InlineLinkButton>
    );

    const andString = !hasCamera && !hasMicrophone && c('Info').t` and `;

    return (
        <div
            className="absolute top-custom left-custom px-4 py-2 bg-norm border-none rounded-full flex items-center"
            style={{ '--top-custom': '3rem', '--left-custom': '50%', transform: 'translateX(-50%)' }}
        >
            {
                // translator: full sentence is: No <microphone> and <camera> detected.
                c('Info').jt`No ${microphoneLinkButton}${andString}${cameraLinkButton} detected.`
            }

            <Button
                shape="ghost"
                size="tiny"
                className="ml-4 rounded-full"
                onClick={() => setIsOpen(false)}
                aria-label={c('Action').t`Close`}
            >
                <IcCross className="color-hint" size={4} />
            </Button>
        </div>
    );
};
