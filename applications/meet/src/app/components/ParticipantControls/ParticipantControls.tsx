import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    IcCogWheel,
    IcInfoCircle,
    IcMeetCamera,
    IcMeetCameraOff,
    IcMeetChat,
    IcMeetMicrophone,
    IcMeetMicrophoneOff,
    IcMeetParticipants,
} from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { Pagination } from '../../atoms/Pagination';
import { PAGE_SIZE } from '../../constants';
import { useMeetContext } from '../../contexts/MeetContext';
import { AudioSettings } from '../AudioSettings';
import { ScreenShareButton } from '../ScreenShareButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { VideoSettings } from '../VideoSettings';

import './ParticipantControls.scss';

export const ParticipantControls = () => {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const {
        isParticipantsOpen,
        setIsParticipantsOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        audioDeviceId,
        videoDeviceId,
        resolution,
    } = useMeetContext();

    const participants = useParticipants();

    const { roomName, page, setPage } = useMeetContext();

    const handleMicrophoneClick = () => {
        void localParticipant?.setMicrophoneEnabled(
            !isMicrophoneEnabled,
            !isMicrophoneEnabled
                ? {
                      deviceId: { exact: audioDeviceId },
                  }
                : undefined
        );

        if (isMicrophoneEnabled) {
            const audioTrack = Array.from(localParticipant.trackPublications.values()).find(
                (pub) => pub.kind === Track.Kind.Audio && pub.track
            )?.track;
            if (audioTrack && audioTrack.mediaStreamTrack) {
                audioTrack.mediaStreamTrack.stop();
            }
        }
    };

    const pageCount = Math.ceil(participants.length / PAGE_SIZE);

    return (
        <div className="flex flex-nowrap justify-center items-center gap-2 h-custom" style={{ '--h-custom': '6.5rem' }}>
            <div className="flex flex-1 justify-start h3">{roomName}</div>
            <div className="flex flex-nowrap gap-2">
                <ToggleButton
                    OnIconComponent={IcMeetMicrophone}
                    OffIconComponent={IcMeetMicrophoneOff}
                    isOn={isMicrophoneEnabled}
                    onClick={handleMicrophoneClick}
                    Content={AudioSettings}
                />
                <ToggleButton
                    OnIconComponent={IcMeetCamera}
                    OffIconComponent={IcMeetCameraOff}
                    isOn={isCameraEnabled}
                    onClick={() =>
                        localParticipant?.setCameraEnabled(
                            !isCameraEnabled,
                            !isCameraEnabled
                                ? {
                                      deviceId: { exact: videoDeviceId },
                                      resolution: {
                                          width: Number(resolution?.split('x')[0]),
                                          height: Number(resolution?.split('x')[1]),
                                      },
                                  }
                                : undefined
                        )
                    }
                    Content={() => <VideoSettings />}
                />
                <ScreenShareButton />
                <CircleButton
                    IconComponent={IcMeetParticipants}
                    variant={isParticipantsOpen ? 'active' : 'default'}
                    onClick={() => {
                        setIsParticipantsOpen(!isParticipantsOpen);
                        setIsSettingsOpen(false);
                    }}
                    indicatorContent={participants.length.toString()}
                    indicatorStatus={isParticipantsOpen ? 'success' : 'default'}
                    iconViewPort="0 0 24 24"
                />
                <CircleButton IconComponent={IcMeetChat} iconViewPort="0 0 24 24" />
                <CircleButton
                    IconComponent={IcCogWheel}
                    variant={isSettingsOpen ? 'active' : 'default'}
                    onClick={() => {
                        setIsSettingsOpen(!isSettingsOpen);
                        setIsParticipantsOpen(false);
                    }}
                />
                <CircleButton IconComponent={IcInfoCircle} />
                <Button className="px-8 py-4 leave-button" pill={true} size="large">{c('Meet').t`Leave`}</Button>
            </div>
            <div className="flex flex-1 justify-end">
                {pageCount > 1 && <Pagination totalPages={pageCount} currentPage={page} onPageChange={setPage} />}
            </div>
        </div>
    );
};
