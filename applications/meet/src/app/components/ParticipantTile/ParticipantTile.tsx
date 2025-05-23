import { type Participant, Track } from 'livekit-client';

import { IcMeetMicrophone, IcMeetMicrophoneOff } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useDebouncedSpeakingStatus } from '../../hooks/useDebouncedSpeakingStatus';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';

import './ParticipantTile.scss';

interface ParticipantTileProps {
    participant: Participant;
    index: number;
}

const getCameraVideoPublication = (participant: Participant) => {
    return Array.from(participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Video && pub.source !== Track.Source.ScreenShare && pub.track
    );
};

export const ParticipantTile = ({ participant, index }: ParticipantTileProps) => {
    const cameraVideoPublication = getCameraVideoPublication(participant);
    const audioPublication = Array.from(participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Audio && pub.track
    );

    const audioIsOn = audioPublication ? !audioPublication.isMuted : false;
    const shouldShowVideo =
        !!cameraVideoPublication && !!cameraVideoPublication.track && !cameraVideoPublication.isMuted;

    const isSpeaking = useDebouncedSpeakingStatus(participant);

    const speakingIndicatorClassName = shouldShowVideo ? 'tile-border-1' : `tile-border-${(index % 6) + 1}`;

    return (
        <div
            className={clsx(
                'participant-tile-body',
                'relative rounded-xl w-full h-full flex flex-nowrap items-center justify-center',
                isSpeaking && speakingIndicatorClassName
            )}
        >
            {isSpeaking && (
                <div
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                    }}
                >
                    <SpeakingIndicator size={32} iconSize={5} />
                </div>
            )}
            <div
                className="color-norm flex flex-nowrap items-center absolute left-custom bottom-custom"
                style={{ '--left-custom': '20px', '--bottom-custom': '20px', gap: '0.625rem' }}
            >
                {audioIsOn ? (
                    <IcMeetMicrophone size={4} viewBox="0 0 24 24" />
                ) : (
                    <IcMeetMicrophoneOff size={4} viewBox="0 0 24 24" />
                )}
                {participant.name}
            </div>
            {shouldShowVideo ? (
                <video
                    className="participant-tile-body__video bg-strong w-full h-full rounded-xl"
                    ref={(el) => {
                        if (el && cameraVideoPublication?.track) {
                            cameraVideoPublication.track.attach(el);
                        }
                    }}
                    muted={participant.isLocal}
                />
            ) : (
                <ParticipantPlaceholder participant={participant} index={index} />
            )}
        </div>
    );
};
