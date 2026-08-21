import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useLocalParticipant } from '@livekit/components-react';
import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetMicrophone } from '@proton/icons/icons/IcMeetMicrophone';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCameraPermission,
    selectCameras,
    selectMicrophonePermission,
    selectMicrophones,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { selectPage, selectPageCount, setPage } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import {
    MeetingSideBars,
    PopUpControls,
    selectPopupState,
    selectSideBarState,
    togglePopupState,
    toggleSideBarState,
} from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination/Pagination';
import { useDebugOverlayContext } from '../../contexts/DebugOverlayContext';
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
import { InfoButton } from '../InfoButton/InfoButton';
import { LeaveMeetingPopup } from '../LeaveMeetingPopup/LeaveMeetingPopup';
import { MeetingName } from '../MeetingName/MeetingName';
import { MicrophoneWithVolumeWithMicrophoneState } from '../MicrophoneWithVolume';
import { ParticipantsButton } from '../ParticipantsButton';
import { RecordingControls } from '../RecordingControls/RecordingControls';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings/VideoSettings';
import { MenuButton } from './MenuButton';

import './ParticipantControls.scss';

export const ParticipantControls = () => {
    const dispatch = useMeetDispatch();
    const { isEnabled: isDebugEnabled } = useDebugOverlayContext();
    const { container: deviceStateContainer, open: openDeviceStateWindow } = useDetachedWindow('Device Debugger');
    const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const [isCameraToggleLoading, withCameraToggleLoading] = useLoading();
    const isScreenShare = useMeetSelector(selectIsScreenShare);
    const page = useMeetSelector(selectPage);
    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();
    const { viewportWidth } = useActiveBreakpoint();

    const sideBarState = useMeetSelector(selectSideBarState);
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
            {!isLargerThanMd && !isNarrowHeight && pageCount > 1 && !isScreenShare && (
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
                    <MeetingName classNames={{ root: 'pl-4 h3', duration: 'ml-2' }} />
                </div>

                <div
                    {...toolbarProps}
                    role="toolbar"
                    aria-label={c('Accessibility').t`Meeting controls`}
                    className="participant-controls-buttons flex flex-nowrap w-full lg:w-auto gap-1 sm:gap-2 items-center"
                >
                    {!isMobile() ? (
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

                    <div className="flex-nowrap gap-2 hidden lg:flex">
                        <ScreenShareButton />
                        <ParticipantsButton />
                        <ChatButton />
                        <EmojiReactionButton />
                        <CircleButton
                            IconComponent={IcMeetSettings}
                            variant={sideBarState[MeetingSideBars.Settings] ? 'active' : 'default'}
                            onClick={() => {
                                dispatch(toggleSideBarState(MeetingSideBars.Settings));
                            }}
                            ariaLabel={c('Alt').t`Toggle settings`}
                        />
                        <RecordingControls />
                        <InfoButton />
                        {isDebugEnabled && (
                            <CircleButton
                                IconComponent={IcBug}
                                onClick={openDeviceStateWindow}
                                ariaLabel={c('Alt').t`Device Debugger`}
                            />
                        )}
                    </div>
                    <div className="flex lg:hidden gap-1 sm:gap-2 flex-nowrap">
                        {isMobile() ? (
                            <>
                                <ChatButton />
                                {!viewportWidth.xsmall && <EmojiReactionButton />}
                            </>
                        ) : (
                            <>
                                <div className="hidden md:block">
                                    <ScreenShareButton />
                                </div>
                                <EmojiReactionButton />
                            </>
                        )}
                        {!isMobile() && (
                            <div className="hidden md:block">
                                <InfoButton />
                            </div>
                        )}
                        <RecordingControls />
                        <MenuButton onOpenDeviceState={openDeviceStateWindow} />
                    </div>

                    <LeaveMeetingPopup />
                </div>
                <div className="flex flex-1 justify-end">
                    {isLargerThanMd && !isScreenShare && pageCount > 1 && (
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
