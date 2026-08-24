import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import type { PopperPosition } from '@proton/atoms/Popper/interface';
import { useActiveBreakpoint } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcImage } from '@proton/icons/icons/IcImage';
import { IcMeetBlur } from '@proton/icons/icons/IcMeetBlur';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { MeetingSideBars, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { ConditionalTooltip } from '../../atoms/ConditionalTooltip/ConditionalTooltip';
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
    showVirtualBackgroundButton?: boolean;
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
    showVirtualBackgroundButton = false,
}: VideoSettingsDropdownProps) => {
    const noCameraDetected = cameras.length === 0;

    const dispatch = useMeetDispatch();

    const { activeBreakpoint } = useActiveBreakpoint();

    const { backgroundBlur, toggleBackgroundBlur, isBackgroundBlurSupported } = useMediaManagementContext();

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');

    const [loadingBackgroundBlur, withLoadingBackgroundBlur] = useLoading();

    return (
        <DeviceSettingsDropdown
            anchorPosition={anchorPosition}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement={activeBreakpoint === 'small' ? 'top-end' : 'top-start'}
        >
            <section
                className="flex flex-column gap-2 px-4 py-2 meet-scrollbar scrollbar-always-visible overflow-x-hidden overflow-y-auto"
                aria-label={c('Aria').t`Video settings`}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
            >
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight text-uppercase text-sm" id="video-camera-label">
                        {noCameraDetected ? c('Info').t`No camera detected` : c('Info').t`Select a camera`}
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                    <div role="listbox" aria-labelledby="video-camera-label" className="flex flex-column gap-2">
                        {cameras.map((camera) => (
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
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
                                role="option"
                                ariaSelected={camera.deviceId === videoDeviceId}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex flex-column gap-4">
                    <div className="color-weak meet-font-weight text-uppercase text-sm">{c('Info')
                        .t`Camera effects`}</div>
                    <div className="flex items-center flex-nowrap w-full pr-4">
                        <div
                            className="flex items-center justify-center w-custom min-w-custom mr-2"
                            style={{ '--w-custom': '2rem', '--min-w-custom': '2rem' }}
                        >
                            <IcMeetBlur size={5} style={{ color: 'var(--text-weak)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <BackgroundBlurToggle
                                backgroundBlur={backgroundBlur}
                                loadingBackgroundBlur={loadingBackgroundBlur}
                                isBackgroundBlurSupported={isBackgroundBlurSupported}
                                onChange={() => {
                                    void withLoadingBackgroundBlur(toggleBackgroundBlur());
                                }}
                                withTooltip
                                size="medium"
                            />
                        </div>
                    </div>
                    {showVirtualBackgroundButton && isVirtualBackgroundEnabled && !isMobile() && (
                        <>
                            <hr className="w-full m-0 border-weak" />

                            <ConditionalTooltip
                                title={
                                    isBackgroundBlurSupported
                                        ? undefined
                                        : c('Tooltip').t`Background effects are not supported on your browser`
                                }
                            >
                                <span className="inline-block w-full">
                                    <OptionButton
                                        showIcon
                                        Icon={IcImage}
                                        label={c('Action').t`Backgrounds and effects`}
                                        disabled={!isBackgroundBlurSupported}
                                        onClick={() => {
                                            onClose();
                                            dispatch(toggleSideBarState(MeetingSideBars.Backgrounds));
                                        }}
                                        rightContent={
                                            <IcChevronRight
                                                size={4}
                                                className="ml-auto shrink-0"
                                                style={{ color: 'var(--text-weak)' }}
                                            />
                                        }
                                    />
                                </span>
                            </ConditionalTooltip>
                        </>
                    )}
                </div>
            </section>
        </DeviceSettingsDropdown>
    );
};

export const VideoSettingsDropdown = React.memo(VideoSettingsDropdownComponent);
