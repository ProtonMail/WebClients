import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { c } from 'ttag';

import type { IconSize } from '@proton/icons';
import {
    IcInfoCircle,
    IcMeetCamera,
    IcMeetCameraOff,
    IcMeetMicrophoneOff,
    IcMeetParticipants,
    IcMeetSettings,
} from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination';
import { useMeetContext } from '../../contexts/MeetContext';
import { useAudioToggle } from '../../hooks/useAudioToggle';
import { useVideoToggle } from '../../hooks/useVideoToggle';
import { MeetingSideBars, PopUpControls } from '../../types';
import { AudioSettings } from '../AudioSettings';
import { ChatButton } from '../ChatButton';
import { LeaveModal } from '../LeaveModal/LeaveModal';
import { MicrophoneWithVolume } from '../MicrophoneWithVolume';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings';

export const ParticipantControls = () => {
    const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const { audioDeviceId, videoDeviceId, sideBarState, toggleSideBarState } = useMeetContext();

    const participants = useParticipants();

    const { roomName, page, setPage, pageSize } = useMeetContext();

    const toggleVideo = useVideoToggle();
    const toggleAudio = useAudioToggle();

    const pageCount = Math.ceil(participants.length / pageSize);

    return (
        <div className="flex flex-nowrap justify-center items-center gap-2 h-custom" style={{ '--h-custom': '5.5rem' }}>
            <div className="flex flex-1 justify-start h3">{roomName}</div>
            <div className="flex flex-nowrap gap-2">
                <ToggleButton
                    OnIconComponent={({ size }) => (
                        <MicrophoneWithVolume isMicrophoneEnabled={isMicrophoneEnabled} size={size as IconSize} />
                    )}
                    OffIconComponent={IcMeetMicrophoneOff}
                    isOn={isMicrophoneEnabled}
                    onClick={() => {
                        void toggleAudio({ isEnabled: !isMicrophoneEnabled, audioDeviceId });
                    }}
                    Content={AudioSettings}
                    popUp={PopUpControls.Microphone}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle microphone`}
                    secondaryAriaLabel={c('l10n_nightly Alt').t`Audio settings`}
                />
                <ToggleButton
                    OnIconComponent={IcMeetCamera}
                    OffIconComponent={IcMeetCameraOff}
                    isOn={isCameraEnabled}
                    onClick={() => {
                        void toggleVideo({ isEnabled: !isCameraEnabled, videoDeviceId });
                    }}
                    Content={() => <VideoSettings />}
                    popUp={PopUpControls.Camera}
                    ariaLabel={c('l10n_nightly Alt').t`Toggle camera`}
                    secondaryAriaLabel={c('l10n_nightly Alt').t`Video settings`}
                />
                <ScreenShareButton />
                <CircleButton
                    IconComponent={IcMeetParticipants}
                    variant={sideBarState[MeetingSideBars.Participants] ? 'active' : 'default'}
                    onClick={() => {
                        toggleSideBarState(MeetingSideBars.Participants);
                    }}
                    indicatorContent={participants.length.toString()}
                    indicatorStatus={'success'}
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
