import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useLocalParticipant } from '@livekit/components-react';
import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetMicrophone } from '@proton/icons/icons/IcMeetMicrophone';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCameraPermission,
    selectCameras,
    selectMicrophonePermission,
    selectMicrophones,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { selectIsSpotlightLayout } from '@proton/meet/store/slices/layoutSlice';
import { selectPage, selectPageCount, setPage } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { PopUpControls, selectPopupState, togglePopupState } from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination/Pagination';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { useToolbarRovingFocus } from '../../hooks/useToolbarRovingFocus';
import { getCameraButtonAriaLabel, getMicrophoneButtonAriaLabel } from '../../utils/mediaButtonAriaLabels';
import { cameraShortcutLabel, microphoneShortcutLabel } from '../../utils/mediaShortcuts';
import { AudioPlaybackPrompt } from '../AudioPlaybackPrompt/AudioPlaybackPrompt';
import { AudioSettings } from '../AudioSettings/AudioSettings';
import { ChatButton } from '../ChatButton';
import { DeviceStateReport } from '../DebugOverlay/DeviceStateReport';
import { useDetachedWindow } from '../DebugOverlay/useDetachedWindow';
import { EmojiReactionButton } from '../EmojiReactionButton/EmojiReactionButton';
import { LeaveMeetingPopup } from '../LeaveMeetingPopup/LeaveMeetingPopup';
import { MeetingName } from '../MeetingName/MeetingName';
import { MeetingSnackbars } from '../MeetingSnackbars/MeetingSnackbars';
import { MicrophoneWithVolumeWithMicrophoneState } from '../MicrophoneWithVolume';
import { ParticipantsButton } from '../ParticipantsButton';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings/VideoSettings';
import { MoreMenu } from './MoreMenu/MoreMenu';

import './ParticipantControls.scss';

export const ParticipantControls = () => {
    const dispatch = useMeetDispatch();
    const { container: deviceStateContainer, open: openDeviceStateWindow } = useDetachedWindow('Device Debugger');
    const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const [isCameraToggleLoading, withCameraToggleLoading] = useLoading();
    const isSpotlightLayout = useMeetSelector(selectIsSpotlightLayout);
    const page = useMeetSelector(selectPage);
    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallScreen = viewportWidth['<=small'];
    const isLargeDesktop = viewportWidth['>=xlarge'];

    const popupState = useMeetSelector(selectPopupState);

    const pageCount = useMeetSelector(selectPageCount);

    const prevDevicePermissionsRef = useRef<{ camera?: PermissionState; microphone?: PermissionState }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);
    const microphones = useMeetSelector(selectMicrophones);
    const cameras = useMeetSelector(selectCameras);

    const hasCameraPermission = cameraPermission === 'granted';
    const hasMicrophonePermission = microphonePermission === 'granted';

    const { handleMicrophoneToggle, handleCameraToggle } = useMediaManagementContext();

    const { toolbarProps } = useToolbarRovingFocus<HTMLDivElement>();

    // Closing popups with device selection options upon losing permissions
    useEffect(() => {
        if (
            cameraPermission !== 'granted' &&
            cameraPermission !== prevDevicePermissionsRef.current.camera &&
            popupState.Camera
        ) {
            dispatch(togglePopupState(PopUpControls.Camera));
        }

        if (
            microphonePermission !== 'granted' &&
            microphonePermission !== prevDevicePermissionsRef.current.microphone &&
            popupState.Microphone
        ) {
            dispatch(togglePopupState(PopUpControls.Microphone));
        }

        prevDevicePermissionsRef.current = { camera: cameraPermission, microphone: microphonePermission };
    }, [cameraPermission, dispatch, microphonePermission, popupState.Camera, popupState.Microphone]);

    const microphoneHasWarning = !hasMicrophonePermission || microphones.length === 0;

    const microphoneLabel = getMicrophoneButtonAriaLabel({
        hasPermission: hasMicrophonePermission,
        noDeviceDetected: microphones.length === 0,
        isEnabled: isMicrophoneEnabled,
    });

    const microphoneTooltipTitle = `${microphoneLabel} (${microphoneShortcutLabel})`;

    const cameraHasWarning = !hasCameraPermission || cameras.length === 0;

    const cameraLabel = getCameraButtonAriaLabel({
        hasPermission: hasCameraPermission,
        noDeviceDetected: cameras.length === 0,
        isEnabled: isCameraEnabled,
    });

    const cameraTooltipTitle = `${cameraLabel} (${cameraShortcutLabel})`;

    return (
        <div className="w-full flex flex-nowrap flex-column relative">
            <AudioPlaybackPrompt />
            {!isLargerThanMd && <MeetingSnackbars />}
            {!isLargerThanMd && !isNarrowHeight && pageCount > 1 && !isSpotlightLayout && (
                <div className="w-full flex justify-center">
                    <Pagination
                        totalPages={pageCount}
                        currentPage={page}
                        onPageChange={(page) => dispatch(setPage(page))}
                    />
                </div>
            )}
            <div
                className={clsx(
                    isNarrowHeight ? 'justify-space-between' : 'justify-center',
                    'flex flex-nowrap items-center gap-2 h-custom w-full'
                )}
                style={{ '--h-custom': '5rem' }}
            >
                <div className={clsx('lg:flex flex-1 justify-start', isLargerThanMd || isNarrowHeight ? '' : 'hidden')}>
                    {(isLargeDesktop || isNarrowHeight) && (
                        <MeetingName classNames={{ root: 'pl-4 h3', duration: 'ml-2' }} />
                    )}
                </div>

                <div
                    {...toolbarProps}
                    role="toolbar"
                    aria-label={c('Accessibility').t`Meeting controls`}
                    className="participant-controls-buttons flex flex-nowrap w-full lg:w-auto gap-1 sm:gap-2 items-center"
                >
                    {!isMobile() && !isSmallScreen ? (
                        <>
                            <ToggleButton
                                OnIconComponent={MicrophoneWithVolumeWithMicrophoneState}
                                OffIconComponent={IcMeetMicrophoneOff}
                                isOn={microphones.length === 0 ? false : isMicrophoneEnabled}
                                onClick={() => {
                                    void handleMicrophoneToggle();
                                }}
                                Content={AudioSettings}
                                popUp={PopUpControls.Microphone}
                                ariaLabel={microphoneLabel}
                                ariaPressed={microphoneHasWarning ? undefined : isMicrophoneEnabled}
                                secondaryAriaLabel={c('Alt').t`Audio settings`}
                                hasWarning={microphoneHasWarning}
                                tooltipTitle={microphoneTooltipTitle}
                                tooltipClassName="meet-tooltip--nowrap"
                                isOpen={popupState[PopUpControls.Microphone]}
                                onPopupButtonClick={() => {
                                    if (!hasMicrophonePermission) {
                                        return;
                                    }

                                    dispatch(togglePopupState(PopUpControls.Microphone));
                                }}
                            />
                            <ToggleButton
                                OnIconComponent={IcMeetCamera}
                                OffIconComponent={IcMeetCameraOff}
                                isOn={cameras.length === 0 ? false : isCameraEnabled}
                                loading={isCameraToggleLoading}
                                onClick={() => {
                                    const result = handleCameraToggle();
                                    if (result) {
                                        void withCameraToggleLoading(result);
                                    }
                                }}
                                Content={VideoSettings}
                                popUp={PopUpControls.Camera}
                                ariaLabel={cameraLabel}
                                ariaPressed={cameraHasWarning ? undefined : isCameraEnabled}
                                secondaryAriaLabel={c('Alt').t`Video settings`}
                                hasWarning={cameraHasWarning}
                                tooltipTitle={cameraTooltipTitle}
                                tooltipClassName="meet-tooltip--nowrap"
                                isOpen={popupState[PopUpControls.Camera]}
                                onPopupButtonClick={() => {
                                    if (!hasCameraPermission) {
                                        return;
                                    }

                                    dispatch(togglePopupState(PopUpControls.Camera));
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <CircleButton
                                IconComponent={isMicrophoneEnabled ? IcMeetMicrophone : IcMeetMicrophoneOff}
                                variant={isMicrophoneEnabled ? 'default' : 'danger'}
                                onClick={() => {
                                    void handleMicrophoneToggle();
                                }}
                                indicatorContent={microphoneHasWarning ? '!' : undefined}
                                indicatorStatus={microphoneHasWarning ? 'warning' : 'success'}
                                ariaLabel={microphoneLabel}
                                ariaPressed={microphoneHasWarning ? undefined : isMicrophoneEnabled}
                            />
                            <CircleButton
                                IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                                variant={isCameraEnabled ? 'default' : 'danger'}
                                loading={isCameraToggleLoading}
                                onClick={() => {
                                    const result = handleCameraToggle();
                                    if (result) {
                                        void withCameraToggleLoading(result);
                                    }
                                }}
                                indicatorContent={cameraHasWarning ? '!' : undefined}
                                indicatorStatus={cameraHasWarning ? 'warning' : 'success'}
                                ariaLabel={cameraLabel}
                                ariaPressed={cameraHasWarning ? undefined : isCameraEnabled}
                            />
                        </>
                    )}

                    {isSmallScreen ? (
                        <ChatButton />
                    ) : (
                        <>
                            <ScreenShareButton />
                            <ParticipantsButton />
                            <ChatButton />
                            <EmojiReactionButton />
                        </>
                    )}
                    <MoreMenu variant={isSmallScreen ? 'sheet' : 'popup'} onOpenDeviceState={openDeviceStateWindow} />
                    <LeaveMeetingPopup />
                </div>
                <div
                    className={clsx(
                        'lg:flex flex-1 justify-end items-center gap-2 pr-4',
                        isLargerThanMd || isNarrowHeight ? 'flex' : 'hidden'
                    )}
                >
                    {isLargerThanMd && !isSpotlightLayout && pageCount > 1 && (
                        <Pagination
                            totalPages={pageCount}
                            currentPage={page}
                            onPageChange={(page) => dispatch(setPage(page))}
                        />
                    )}
                </div>
            </div>
            {deviceStateContainer &&
                createPortal(
                    <div
                        className="p-4 overflow-auto max-h-custom"
                        style={{ '--max-h-custom': '100vh' } as React.CSSProperties}
                    >
                        <DeviceStateReport />
                    </div>,
                    deviceStateContainer
                )}
        </div>
    );
};
