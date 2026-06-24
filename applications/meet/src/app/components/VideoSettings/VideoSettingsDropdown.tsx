import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import type { PopperPosition } from '@proton/components/components/popper/interface';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';
import { BackgroundBlurToggle } from '../Settings/BackgroundBlurToggle';

interface VideoSettingsDropdownProps {
    anchorRef: RefObject<HTMLButtonElement>;
    handleCameraChange: (deviceId: string) => Promise<void>;
    videoDeviceId: string | null;
    cameras: SerializableDeviceInfo[];
    onClose: () => void;
    anchorPosition?: PopperPosition;
    isCameraLoading: (deviceId: string) => boolean;
    withCameraLoading: (deviceId: string, operation: () => Promise<void>) => Promise<void>;
}

const VideoSettingsDropdownComponent = ({
    anchorRef,
    handleCameraChange,
    videoDeviceId,
    cameras,
    onClose,
    anchorPosition,
    isCameraLoading,
    withCameraLoading,
}: VideoSettingsDropdownProps) => {
    const noCameraDetected = cameras.length === 0;

    const { activeBreakpoint } = useActiveBreakpoint();

    const { backgroundBlur, toggleBackgroundBlur, isBackgroundBlurSupported } = useMediaManagementContext();

    const [loadingBackgroundBlur, withLoadingBackgroundBlur] = useLoading();

    return (
        <DeviceSettingsDropdown
            anchorPosition={anchorPosition}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement={activeBreakpoint === 'small' ? 'top-end' : 'top-start'}
        >
            <div className="flex flex-column gap-2 px-4 py-2 meet-scrollbar overflow-x-hidden overflow-y-auto">
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight text-uppercase text-sm">
                        {noCameraDetected ? c('Info').t`No camera detected` : c('Info').t`Select a camera`}
                    </div>
                    {cameras.map((camera) => (
                        <OptionButton
                            key={camera.deviceId}
                            showIcon={camera.deviceId === videoDeviceId}
                            label={camera.label}
                            onClick={() => {
                                if (camera.deviceId === videoDeviceId) {
                                    return;
                                }

                                void withCameraLoading(camera.deviceId, () => handleCameraChange(camera.deviceId));
                            }}
                            loading={isCameraLoading(camera.deviceId)}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
                <div className="flex flex-column gap-4">
                    <div className="color-weak meet-font-weight text-uppercase text-sm">{c('Info')
                        .t`Video effects`}</div>
                    <div className="w-full pl-8 pr-4 ml-0.5">
                        <BackgroundBlurToggle
                            backgroundBlur={backgroundBlur}
                            loadingBackgroundBlur={loadingBackgroundBlur}
                            isBackgroundBlurSupported={isBackgroundBlurSupported}
                            onChange={() => {
                                void withLoadingBackgroundBlur(toggleBackgroundBlur());
                            }}
                            withTooltip
                        />
                    </div>
                </div>
            </div>
        </DeviceSettingsDropdown>
    );
};

export const VideoSettingsDropdown = React.memo(VideoSettingsDropdownComponent);
