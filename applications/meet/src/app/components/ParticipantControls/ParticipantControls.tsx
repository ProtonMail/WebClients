import { useEffect, useRef } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { c } from 'ttag';

import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetMicrophone } from '@proton/icons/icons/IcMeetMicrophone';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination/Pagination';
import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { MeetingSideBars, PermissionPromptStatus, PopUpControls } from '../../types';
import { AudioSettings } from '../AudioSettings/AudioSettings';
import { ChatButton } from '../ChatButton';
import { LeaveModal } from '../LeaveModal/LeaveModal';
import { MicrophoneWithVolumeWithMicrophoneState } from '../MicrophoneWithVolume';
import { ParticipantsButton, WrappedParticipantsButton } from '../ParticipantsButton';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings/VideoSettings';
import { MenuButton } from './MenuButton';

import './ParticipantControls.scss';

export const ParticipantControls = () => {
    const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();
    const { roomName, page, setPage, pageSize, participantsMap, isScreenShare, guestMode } = useMeetContext();

    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();

    const {
        sideBarState,
        toggleSideBarState,
        togglePopupState,
        setPermissionPromptStatus,
        setNoDeviceDetected,
        popupState,
    } = useUIStateContext();

    const participants = useParticipants();

    const participantData = participantsMap[localParticipant.identity];
    const hasAdminPermission =
        participantData !== undefined ? !!participantData.IsAdmin || !!participantData.IsHost : false;

    const prevDevicePermissionsRef = useRef<{ camera?: PermissionState; microphone?: PermissionState }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const pageCount = Math.ceil(participants.length / pageSize);

    const {
        devicePermissions: { camera: cameraPermission, microphone: microphonePermission },
    } = useMediaManagementContext();

    const hasCameraPermission = cameraPermission === 'granted';
    const hasMicrophonePermission = microphonePermission === 'granted';

    const {
        microphones,
        cameras,
        toggleVideo,
        toggleAudio,
        selectedMicrophoneId: audioDeviceId,
        selectedCameraId: videoDeviceId,
    } = useMediaManagementContext();

    // Closing popups with device selection options upon losing permissions
    useEffect(() => {
        if (
            cameraPermission !== 'granted' &&
            cameraPermission !== prevDevicePermissionsRef.current.camera &&
            popupState[PopUpControls.Camera]
        ) {
            togglePopupState(PopUpControls.Camera);
        }

        if (
            microphonePermission !== 'granted' &&
            microphonePermission !== prevDevicePermissionsRef.current.microphone &&
            popupState[PopUpControls.Microphone]
        ) {
            togglePopupState(PopUpControls.Microphone);
        }

        prevDevicePermissionsRef.current = { camera: cameraPermission, microphone: microphonePermission };
    }, [cameraPermission, microphonePermission]);

    const microphoneHasWarning = !hasMicrophonePermission || microphones.length === 0;

    let microphoneTooltipTitle;
    if (microphoneHasWarning) {
        if (!hasMicrophonePermission) {
            microphoneTooltipTitle = c('Info').t`Permission denied`;
        } else {
            microphoneTooltipTitle = c('Info').t`No microphone detected`;
        }
    } else {
        microphoneTooltipTitle = isMicrophoneEnabled
            ? c('Info').t`Turn off microphone`
            : c('Info').t`Turn on microphone`;
    }

    const cameraHasWarning = !hasCameraPermission || cameras.length === 0;

    let cameraTooltipTitle;
    if (cameraHasWarning) {
        if (!hasCameraPermission) {
            cameraTooltipTitle = c('Info').t`Permission denied`;
        } else {
            cameraTooltipTitle = c('Info').t`No camera detected`;
        }
    } else {
        cameraTooltipTitle = isCameraEnabled ? c('Info').t`Turn off camera` : c('Info').t`Turn on camera`;
    }

    return (
        <div className="w-full flex flex-nowrap flex-column">
            {!isLargerThanMd && !isNarrowHeight && pageCount > 1 && !isScreenShare && (
                <div className="w-full flex justify-center">
                    <Pagination totalPages={pageCount} currentPage={page} onPageChange={setPage} />
                </div>
            )}
            <div
                className={clsx(
                    isNarrowHeight ? 'justify-space-between' : 'justify-center',
                    'flex flex-nowrap items-center gap-2 h-custom w-full'
                )}
                style={{ '--h-custom': '5rem' }}
            >
                <div
                    className={clsx(
                        isLargerThanMd || isNarrowHeight ? '' : 'hidden',
                        'lg:flex flex-1 justify-start h3'
                    )}
                >
                    {roomName}
                </div>
                <div className="participant-controls-buttons flex flex-nowrap gap-2">
                    {!isMobile() ? (
                        <>
                            <ToggleButton
                                OnIconComponent={MicrophoneWithVolumeWithMicrophoneState}
                                OffIconComponent={IcMeetMicrophoneOff}
                                isOn={microphones.length === 0 ? false : isMicrophoneEnabled}
                                onClick={() => {
                                    if (!hasMicrophonePermission) {
                                        setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE);
                                        return;
                                    }
                                    if (microphones.length === 0) {
                                        setNoDeviceDetected(PermissionPromptStatus.MICROPHONE);
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
                                ariaLabel={c('Alt').t`Toggle microphone`}
                                secondaryAriaLabel={c('Alt').t`Audio settings`}
                                hasWarning={microphoneHasWarning}
                                tooltipTitle={microphoneTooltipTitle}
                                isOpen={popupState[PopUpControls.Microphone]}
                                onPopupButtonClick={() => {
                                    if (!hasMicrophonePermission) {
                                        return;
                                    }

                                    togglePopupState(PopUpControls.Microphone);
                                }}
                            />
                            <ToggleButton
                                OnIconComponent={IcMeetCamera}
                                OffIconComponent={IcMeetCameraOff}
                                isOn={cameras.length === 0 ? false : isCameraEnabled}
                                onClick={() => {
                                    if (!hasCameraPermission) {
                                        setPermissionPromptStatus(PermissionPromptStatus.CAMERA);
                                        return;
                                    }
                                    if (cameras.length === 0) {
                                        setNoDeviceDetected(PermissionPromptStatus.CAMERA);
                                        return;
                                    }

                                    if (videoDeviceId) {
                                        void toggleVideo({
                                            isEnabled: !isCameraEnabled,
                                            videoDeviceId,
                                            preserveCache: true,
                                        });
                                    }
                                }}
                                Content={VideoSettings}
                                popUp={PopUpControls.Camera}
                                ariaLabel={c('Alt').t`Toggle camera`}
                                secondaryAriaLabel={c('Alt').t`Video settings`}
                                hasWarning={cameraHasWarning}
                                tooltipTitle={cameraTooltipTitle}
                                isOpen={popupState[PopUpControls.Camera]}
                                onPopupButtonClick={() => {
                                    if (!hasCameraPermission) {
                                        return;
                                    }

                                    togglePopupState(PopUpControls.Camera);
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
                                        setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE);
                                        return;
                                    }
                                    if (microphones.length === 0) {
                                        setNoDeviceDetected(PermissionPromptStatus.MICROPHONE);
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
                                ariaLabel={c('Alt').t`Toggle microphone`}
                            />
                            <CircleButton
                                IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                                variant={isCameraEnabled ? 'default' : 'danger'}
                                onClick={() => {
                                    if (!hasCameraPermission) {
                                        setPermissionPromptStatus(PermissionPromptStatus.CAMERA);
                                        return;
                                    }
                                    if (cameras.length === 0) {
                                        setNoDeviceDetected(PermissionPromptStatus.CAMERA);
                                        return;
                                    }

                                    if (videoDeviceId) {
                                        void toggleVideo({
                                            isEnabled: !isCameraEnabled,
                                            videoDeviceId,
                                            preserveCache: true,
                                        });
                                    }
                                }}
                                indicatorContent={cameraHasWarning ? '!' : undefined}
                                indicatorStatus={cameraHasWarning ? 'warning' : 'success'}
                            />
                        </>
                    )}

                    <div className="flex-nowrap gap-2 hidden lg:flex">
                        <ScreenShareButton />
                        {guestMode ? (
                            <ParticipantsButton hasAdminPermission={hasAdminPermission} isPaid={false} />
                        ) : (
                            <WrappedParticipantsButton hasAdminPermission={hasAdminPermission} />
                        )}

                        <ChatButton />
                        <CircleButton
                            IconComponent={IcMeetSettings}
                            variant={sideBarState[MeetingSideBars.Settings] ? 'active' : 'default'}
                            onClick={() => {
                                toggleSideBarState(MeetingSideBars.Settings);
                            }}
                            ariaLabel={c('Alt').t`Toggle settings`}
                        />
                        <CircleButton
                            IconComponent={IcInfoCircle}
                            onClick={() => toggleSideBarState(MeetingSideBars.MeetingDetails)}
                            variant={sideBarState[MeetingSideBars.MeetingDetails] ? 'active' : 'default'}
                            ariaLabel={c('Alt').t`Toggle meeting details`}
                        />
                    </div>
                    <div className="flex lg:hidden gap-2 flex-nowrap">
                        <ChatButton />
                        <MenuButton />
                    </div>

                    <LeaveModal hasAdminPermission={hasAdminPermission} />
                </div>
                <div className={clsx(isLargerThanMd || isNarrowHeight ? '' : 'hidden', 'flex flex-1 justify-end')}>
                    {pageCount > 1 && <Pagination totalPages={pageCount} currentPage={page} onPageChange={setPage} />}
                </div>
            </div>
        </div>
    );
};
