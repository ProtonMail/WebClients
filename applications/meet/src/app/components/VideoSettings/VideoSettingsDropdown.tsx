import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import type { PopperPosition } from '@proton/components/components/popper/interface';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { DEFAULT_DEVICE_ID } from '../../constants';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { DeviceState } from '../../types';
import { shouldShowDeviceCheckmark, shouldShowSystemDefaultCheckmark } from '../../utils/device-utils';
import { BackgroundBlurToggle } from '../BackgroundBlurToggle';
import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';

interface VideoSettingsDropdownProps {
    anchorRef: RefObject<HTMLButtonElement>;
    handleCameraChange: (deviceId: string) => Promise<void>;
    videoDeviceId: string | null;
    cameraState: DeviceState;
    cameras: MediaDeviceInfo[];
    onClose: () => void;
    anchorPosition?: PopperPosition;
    isCameraLoading: (deviceId: string) => boolean;
    withCameraLoading: (deviceId: string, operation: () => Promise<void>) => Promise<void>;
}

const VideoSettingsDropdownComponent = ({
    anchorRef,
    handleCameraChange,
    videoDeviceId,
    cameraState,
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
                    <div className="color-hint meet-font-weight text-uppercase text-sm">
                        {noCameraDetected ? c('Info').t`No camera detected` : c('Info').t`Select a camera`}
                    </div>
                    {cameraState.systemDefault && (
                        <OptionButton
                            key={DEFAULT_DEVICE_ID}
                            showIcon={shouldShowSystemDefaultCheckmark(cameraState)}
                            label={cameraState.systemDefaultLabel}
                            onClick={() => {
                                const isAlreadySelected = shouldShowSystemDefaultCheckmark(cameraState);
                                if (isAlreadySelected) {
                                    return;
                                }
                                void withCameraLoading(DEFAULT_DEVICE_ID, () => handleCameraChange(DEFAULT_DEVICE_ID));
                            }}
                            loading={isCameraLoading(DEFAULT_DEVICE_ID)}
                            Icon={IcCheckmark}
                        />
                    )}
                    {cameras.map((camera) => (
                        <OptionButton
                            key={camera.deviceId}
                            showIcon={shouldShowDeviceCheckmark(camera.deviceId, videoDeviceId!, cameraState)}
                            label={camera.label}
                            onClick={() => {
                                const isAlreadySelected = shouldShowDeviceCheckmark(
                                    camera.deviceId,
                                    videoDeviceId!,
                                    cameraState
                                );
                                if (isAlreadySelected) {
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
                    <div className="color-hint meet-font-weight text-uppercase text-sm">{c('Info')
                        .t`Video effects`}</div>
                    <div className="w-full pl-8 pr-4 ml-0.5">
                        <BackgroundBlurToggle
                            backgroundBlur={backgroundBlur}
                            loadingBackgroundBlur={loadingBackgroundBlur}
                            isBackgroundBlurSupported={isBackgroundBlurSupported}
                            onChange={() => {
                                void withLoadingBackgroundBlur(toggleBackgroundBlur());
                            }}
                        />
                    </div>
                </div>
            </div>
        </DeviceSettingsDropdown>
    );
};

export const VideoSettingsDropdown = React.memo(VideoSettingsDropdownComponent);
