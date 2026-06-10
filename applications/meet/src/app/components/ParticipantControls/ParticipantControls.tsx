import { useEffect, useRef } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
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
    selectSelectedCameraId,
    selectSelectedMicrophoneId,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectPage, selectPageCount, setPage } from '@proton/meet/store/slices/sortedParticipantsSlice';
import {
    MeetingSideBars,
    PermissionPromptStatus,
    PopUpControls,
    selectPopupState,
    selectSideBarState,
    setNoDeviceDetected,
    setPermissionPromptStatus,
    togglePopupState,
    toggleSideBarState,
} from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination/Pagination';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { getCameraButtonAriaLabel, getMicrophoneButtonAriaLabel } from '../../utils/mediaButtonAriaLabels';
import { AudioPlaybackPrompt } from '../AudioPlaybackPrompt/AudioPlaybackPrompt';
import { AudioSettings } from '../AudioSettings/AudioSettings';
import { ChatButton } from '../ChatButton';
import { EmojiReactionButton } from '../EmojiReactionButton/EmojiReactionButton';
import { InfoButton } from '../InfoButton/InfoButton';
import { LeaveMeetingPopup } from '../LeaveMeetingPopup/LeaveMeetingPopup';
import { MeetingName } from '../MeetingName/MeetingName';
import { MicrophoneWithVolumeWithMicrophoneState } from '../MicrophoneWithVolume';
import { ParticipantsButton, WrappedParticipantsButton } from '../ParticipantsButton';
import { RecordingControls } from '../RecordingControls/RecordingControls';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings/VideoSettings';
import { MenuButton } from './MenuButton';

import './ParticipantControls.scss';

export const ParticipantControls = () => {
    const dispatch = useMeetDispatch();
    const isGuest = useMeetSelector(selectIsGuest);
    const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const [isCameraToggleLoading, withCameraToggleLoading] = useLoading();
    const isScreenShare = useMeetSelector(selectIsScreenShare);
    const page = useMeetSelector(selectPage);
    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();
    const { viewportWidth } = useActiveBreakpoint();

    const sideBarState = useMeetSelector(selectSideBarState);
    const popupState = useMeetSelector(selectPopupState);

    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();

    const hasAdminPermission = isLocalParticipantAdmin || isLocalParticipantHost;

    const pageCount = useMeetSelector(selectPageCount);

    const prevDevicePermissionsRef = useRef<{ camera?: PermissionState; microphone?: PermissionState }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);
    const microphones = useMeetSelector(selectMicrophones);
    const cameras = useMeetSelector(selectCameras);
    const audioDeviceId = useMeetSelector(selectSelectedMicrophoneId);
    const videoDeviceId = useMeetSelector(selectSelectedCameraId);

    const hasCameraPermission = cameraPermission === 'granted';
    const hasMicrophonePermission = microphonePermission === 'granted';

    const { toggleVideo, toggleAudio } = useMediaManagementContext();

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

    const microphoneTooltipTitle = getMicrophoneButtonAriaLabel({
        hasPermission: hasMicrophonePermission,
        noDeviceDetected: microphones.length === 0,
        isEnabled: isMicrophoneEnabled,
    });

    const cameraHasWarning = !hasCameraPermission || cameras.length === 0;

    const cameraTooltipTitle = getCameraButtonAriaLabel({
        hasPermission: hasCameraPermission,
        noDeviceDetected: cameras.length === 0,
        isEnabled: isCameraEnabled,
    });

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

                <div className="participant-controls-buttons flex flex-nowrap w-full lg:w-auto gap-1 sm:gap-2 items-center">
                    {!isMobile() ? (
                        <>
                            <ToggleButton
                                OnIconComponent={MicrophoneWithVolumeWithMicrophoneState}
                                OffIconComponent={IcMeetMicrophoneOff}
                                isOn={microphones.length === 0 ? false : isMicrophoneEnabled}
                                onClick={() => {
                                    if (!hasMicrophonePermission) {
                                        dispatch(setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE));
                                        return;
                                    }
                                    if (microphones.length === 0) {
                                        dispatch(setNoDeviceDetected(PermissionPromptStatus.MICROPHONE));
                                        return;
                                    }

                                    void toggleAudio({
                                        isEnabled: !isMicrophoneEnabled,
                                        audioDeviceId,
                                        preserveCache: true,
                                    });
                                }}
                                Content={AudioSettings}
                                popUp={PopUpControls.Microphone}
                                ariaLabel={microphoneTooltipTitle}
                                ariaPressed={microphoneHasWarning ? undefined : isMicrophoneEnabled}
                                secondaryAriaLabel={c('Alt').t`Audio settings`}
                                hasWarning={microphoneHasWarning}
                                tooltipTitle={microphoneTooltipTitle}
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
                                    if (!hasCameraPermission) {
                                        dispatch(setPermissionPromptStatus(PermissionPromptStatus.CAMERA));
                                        return;
                                    }
                                    if (cameras.length === 0) {
                                        dispatch(setNoDeviceDetected(PermissionPromptStatus.CAMERA));
                                        return;
                                    }

                                    if (videoDeviceId) {
                                        void withCameraToggleLoading(
                                            toggleVideo({
                                                isEnabled: !isCameraEnabled,
                                                videoDeviceId,
                                                preserveCache: true,
                                            })
                                        );
                                    }
                                }}
                                Content={VideoSettings}
                                popUp={PopUpControls.Camera}
                                ariaLabel={cameraTooltipTitle}
                                ariaPressed={cameraHasWarning ? undefined : isCameraEnabled}
                                secondaryAriaLabel={c('Alt').t`Video settings`}
                                hasWarning={cameraHasWarning}
                                tooltipTitle={cameraTooltipTitle}
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
                                    if (!hasMicrophonePermission) {
                                        dispatch(setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE));
                                        return;
                                    }
                                    if (microphones.length === 0) {
                                        dispatch(setNoDeviceDetected(PermissionPromptStatus.MICROPHONE));
                                        return;
                                    }

                                    void toggleAudio({
                                        isEnabled: !isMicrophoneEnabled,
                                        audioDeviceId,
                                        preserveCache: true,
                                    });
                                }}
                                indicatorContent={microphoneHasWarning ? '!' : undefined}
                                indicatorStatus={microphoneHasWarning ? 'warning' : 'success'}
                                ariaLabel={microphoneTooltipTitle}
                                ariaPressed={microphoneHasWarning ? undefined : isMicrophoneEnabled}
                            />
                            <CircleButton
                                IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                                variant={isCameraEnabled ? 'default' : 'danger'}
                                loading={isCameraToggleLoading}
                                onClick={() => {
                                    if (!hasCameraPermission) {
                                        dispatch(setPermissionPromptStatus(PermissionPromptStatus.CAMERA));
                                        return;
                                    }
                                    if (cameras.length === 0) {
                                        dispatch(setNoDeviceDetected(PermissionPromptStatus.CAMERA));
                                        return;
                                    }

                                    if (videoDeviceId) {
                                        void withCameraToggleLoading(
                                            toggleVideo({
                                                isEnabled: !isCameraEnabled,
                                                videoDeviceId,
                                                preserveCache: true,
                                            })
                                        );
                                    }
                                }}
                                indicatorContent={cameraHasWarning ? '!' : undefined}
                                indicatorStatus={cameraHasWarning ? 'warning' : 'success'}
                                ariaLabel={cameraTooltipTitle}
                                ariaPressed={cameraHasWarning ? undefined : isCameraEnabled}
                            />
                        </>
                    )}

                    <div className="flex-nowrap gap-2 hidden lg:flex">
                        <ScreenShareButton />
                        {isGuest ? (
                            <ParticipantsButton hasAdminPermission={hasAdminPermission} isPaid={false} />
                        ) : (
                            <WrappedParticipantsButton hasAdminPermission={hasAdminPermission} />
                        )}
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
                        <MenuButton />
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
        </div>
    );
};
