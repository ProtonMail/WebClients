import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import type { PopperPosition } from '@proton/components/components/popper/interface';
import { IcCheckmark } from '@proton/icons';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';

interface VideoSettingsDropdownProps {
    anchorRef: RefObject<HTMLButtonElement>;
    handleCameraChange: (deviceId: string) => void;
    videoDeviceId: string | null;
    cameras: MediaDeviceInfo[];
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

const VideoSettingsDropdownComponent = ({
    anchorRef,
    handleCameraChange,
    videoDeviceId,
    cameras,
    onClose,
    anchorPosition,
}: VideoSettingsDropdownProps) => {
    const noCameraDetected = cameras.length === 0;

    return (
        <DeviceSettingsDropdown anchorPosition={anchorPosition} anchorRef={anchorRef} onClose={onClose}>
            <div className="flex flex-column gap-2 p-2 meet-scrollbar overflow-x-hidden overflow-y-auto">
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight">
                        {noCameraDetected ? c('Info').t`No camera detected` : c('Info').t`Select a camera`}
                    </div>
                    {cameras.map((camera) => (
                        <OptionButton
                            key={camera.deviceId}
                            showIcon={camera.deviceId === videoDeviceId}
                            label={camera.label}
                            onClick={() => handleCameraChange(camera.deviceId)}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
            </div>
        </DeviceSettingsDropdown>
    );
};

export const VideoSettingsDropdown = React.memo(VideoSettingsDropdownComponent);
