import { useState } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { IcCross } from '@proton/icons';

import { useDevicePermissionsContext } from '../../contexts/DevicePermissionsContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { PermissionPromptStatus } from '../../types';

export const NoPermissionInfo = () => {
    const [isOpen, setIsOpen] = useState(true);

    const { permissionPromptStatus, setPermissionPromptStatus } = useUIStateContext();

    const {
        devicePermissions: { camera, microphone },
    } = useDevicePermissionsContext();

    const isLargerThanMd = useIsLargerThanMd();

    if (!isLargerThanMd) {
        return null;
    }

    const hasCameraPermission = camera === 'granted';
    const hasMicrophonePermission = microphone === 'granted';

    const hasBothPermissions = hasCameraPermission && hasMicrophonePermission;

    if (permissionPromptStatus !== PermissionPromptStatus.CLOSED || !isOpen || hasBothPermissions) {
        return null;
    }

    const microphoneLabel = c('Info').t`microphone`;
    const cameraLabel = c('Info').t`camera`;

    const microphoneLinkButton = !hasMicrophonePermission && (
        <InlineLinkButton
            className="color-primary mx-1"
            onClick={() => {
                setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE);
            }}
        >
            {microphoneLabel}
        </InlineLinkButton>
    );

    const cameraLinkButton = !hasCameraPermission && (
        <InlineLinkButton
            className="color-primary mx-1"
            onClick={() => {
                setPermissionPromptStatus(PermissionPromptStatus.CAMERA);
            }}
        >
            {cameraLabel}
        </InlineLinkButton>
    );

    const andString = !hasCameraPermission && !hasMicrophonePermission && c('Info').t` and `;

    return (
        <div
            className="absolute top-custom left-custom px-4 py-2 bg-norm border-none rounded-full flex items-center"
            style={{ '--top-custom': '3rem', '--left-custom': '50%', transform: 'translateX(-50%)' }}
        >
            {
                // translator: full sentence is: Please enable access to your <microphone> and <camera> for the best experience.
                c('Info').jt`Please enable access to your ${
                    microphoneLinkButton
                }${andString}${cameraLinkButton} for the best experience.`
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
