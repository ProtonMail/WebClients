import { useEffect, useRef } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { c } from 'ttag';

import {
    IcInfoCircle,
    IcMeetCamera,
    IcMeetCameraOff,
    IcMeetMicrophoneOff,
    IcMeetParticipants,
    IcMeetSettings,
} from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination/Pagination';
import { useDevicePermissionsContext } from '../../contexts/DevicePermissionsContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useAudioToggle } from '../../hooks/useAudioToggle';
import { useVideoToggle } from '../../hooks/useVideoToggle';
import { MeetingSideBars, PermissionPromptStatus, PopUpControls } from '../../types';
import { AudioSettings } from '../AudioSettings/AudioSettings';
import { ChatButton } from '../ChatButton';
import { LeaveModal } from '../LeaveModal/LeaveModal';
import { MicrophoneWithVolumeWithMicrophoneState } from '../MicrophoneWithVolume';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings/VideoSettings';

export const ParticipantControls = () => {
    const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const { audioDeviceId, videoDeviceId, roomName, page, setPage, pageSize } = useMeetContext();

    const { sideBarState, toggleSideBarState, togglePopupState, setPermissionPromptStatus, popupState } =
        useUIStateContext();

    const participants = useParticipants();

    const prevDevicePermissionsRef = useRef<{ camera: PermissionState; microphone: PermissionState }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const toggleVideo = useVideoToggle();
    const toggleAudio = useAudioToggle();

    const pageCount = Math.ceil(participants.length / pageSize);

    const anchorRef = useRef<HTMLButtonElement>(null);

    const {
        devicePermissions: { camera, microphone },
    } = useDevicePermissionsContext();

    const hasCameraPermission = camera === 'granted';
    const hasMicrophonePermission = microphone === 'granted';

    useEffect(() => {
        if (
            camera !== 'granted' &&
            camera !== prevDevicePermissionsRef.current.camera &&
            popupState[PopUpControls.Camera]
        ) {
            togglePopupState(PopUpControls.Camera);
        }

        if (
            microphone !== 'granted' &&
            microphone !== prevDevicePermissionsRef.current.microphone &&
            popupState[PopUpControls.Microphone]
        ) {
            togglePopupState(PopUpControls.Microphone);
        }

        prevDevicePermissionsRef.current = { camera, microphone };
    }, [camera, microphone]);

    return (
        <div className="flex flex-nowrap justify-center items-center gap-2 h-custom" style={{ '--h-custom': '5.5rem' }}>
            <div className="flex flex-1 justify-start h3">{roomName}</div>
            <div className="flex flex-nowrap gap-2">
                <ToggleButton
                    buttonRef={anchorRef}
                    OnIconComponent={MicrophoneWithVolumeWithMicrophoneState}
                    OffIconComponent={IcMeetMicrophoneOff}
                    isOn={isMicrophoneEnabled}
                    onClick={() => {
                        if (!hasMicrophonePermission) {
                            setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE);
                            return;
                        }

                        void toggleAudio({ isEnabled: !isMicrophoneEnabled, audioDeviceId });
                    }}
                    Content={AudioSettings}
                    popUp={PopUpControls.Microphone}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle microphone`}
                    secondaryAriaLabel={c('l10n_nightly Alt').t`Audio settings`}
                    hasWarning={!hasMicrophonePermission}
                    tooltipTitle={!hasMicrophonePermission ? c('l10n_nightly Info').t`Permission denied` : undefined}
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
                    isOn={isCameraEnabled}
                    onClick={() => {
                        if (!hasCameraPermission) {
                            setPermissionPromptStatus(PermissionPromptStatus.CAMERA);
                            return;
                        }

                        if (videoDeviceId) {
                            void toggleVideo({ isEnabled: !isCameraEnabled, videoDeviceId });
                        }
                    }}
                    Content={VideoSettings}
                    popUp={PopUpControls.Camera}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle camera`}
                    secondaryAriaLabel={c('l10n_nightly Alt').t`Video settings`}
                    hasWarning={!hasCameraPermission}
                    tooltipTitle={!hasCameraPermission ? c('l10n_nightly Info').t`Permission denied` : undefined}
                    isOpen={popupState[PopUpControls.Camera]}
                    onPopupButtonClick={() => {
                        if (!hasCameraPermission) {
                            return;
                        }

                        togglePopupState(PopUpControls.Camera);
                    }}
                />
                <ScreenShareButton />
                <CircleButton
                    IconComponent={IcMeetParticipants}
                    variant={sideBarState[MeetingSideBars.Participants] ? 'active' : 'default'}
                    onClick={() => {
                        toggleSideBarState(MeetingSideBars.Participants);
                    }}
                    indicatorContent={participants.length.toString()}
                    indicatorStatus={sideBarState[MeetingSideBars.Participants] ? 'success' : 'default'}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle participants`}
                />
                <ChatButton />
                <CircleButton
                    IconComponent={IcMeetSettings}
                    variant={sideBarState[MeetingSideBars.Settings] ? 'active' : 'default'}
                    onClick={() => {
                        toggleSideBarState(MeetingSideBars.Settings);
                    }}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle settings`}
                />
                <CircleButton
                    IconComponent={IcInfoCircle}
                    onClick={() => toggleSideBarState(MeetingSideBars.MeetingDetails)}
                    variant={sideBarState[MeetingSideBars.MeetingDetails] ? 'active' : 'default'}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle meeting details`}
                />
                <LeaveModal />
            </div>
            <div className="flex flex-1 justify-end">
                {pageCount > 1 && <Pagination totalPages={pageCount} currentPage={page} onPageChange={setPage} />}
            </div>
        </div>
    );
};
