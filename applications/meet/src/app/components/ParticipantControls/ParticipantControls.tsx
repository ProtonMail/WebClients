import { useLocalParticipant, useParticipants } from '@livekit/components-react';

import {
    IcCogWheel,
    IcInfoCircle,
    IcMeetCamera,
    IcMeetCameraOff,
    IcMeetMicrophone,
    IcMeetMicrophoneOff,
    IcMeetParticipants,
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
                    OnIconComponent={IcMeetMicrophone}
                    OffIconComponent={IcMeetMicrophoneOff}
                    isOn={isMicrophoneEnabled}
                    onClick={() => {
                        void toggleAudio({ isEnabled: !isMicrophoneEnabled, audioDeviceId });
                    }}
                    Content={AudioSettings}
                    popUp={PopUpControls.Microphone}
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
                    iconViewPort="0 0 24 24"
                />
                <ChatButton />
                <CircleButton
                    IconComponent={IcCogWheel}
                    variant={sideBarState[MeetingSideBars.Settings] ? 'active' : 'default'}
                    onClick={() => {
                        toggleSideBarState(MeetingSideBars.Settings);
                    }}
                />
                <CircleButton
                    IconComponent={IcInfoCircle}
                    onClick={() => toggleSideBarState(MeetingSideBars.MeetingDetails)}
                    variant={sideBarState[MeetingSideBars.MeetingDetails] ? 'active' : 'default'}
                />
                <LeaveModal />
            </div>
            <div className="flex flex-1 justify-end">
                {pageCount > 1 && <Pagination totalPages={pageCount} currentPage={page} onPageChange={setPage} />}
            </div>
        </div>
    );
};
