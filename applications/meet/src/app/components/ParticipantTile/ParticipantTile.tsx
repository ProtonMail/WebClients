import { useLocalParticipant } from '@livekit/components-react';
import { type Participant, Track } from 'livekit-client';
import { c } from 'ttag';

import { IcMeetMicrophoneOff } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMeetContext } from '../../contexts/MeetContext';
import { useDebouncedSpeakingStatus } from '../../hooks/useDebouncedSpeakingStatus';
import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';
import { ConnectionIndicator } from '../ConnectionIndicator/ConnectionIndicator';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';

import './ParticipantTile.scss';

interface ParticipantTileProps {
    participant: Participant;
    smallView?: boolean;
}

const getCameraVideoPublication = (participant: Participant) => {
    return Array.from(participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Video && pub.source !== Track.Source.ScreenShare && pub.track
    );
};

export const ParticipantTile = ({ participant, smallView = false }: ParticipantTileProps) => {
    const { localParticipant } = useLocalParticipant();
    const { shouldShowConnectionIndicator, participantNameMap } = useMeetContext();
    const cameraVideoPublication = getCameraVideoPublication(participant);
    const audioPublication = Array.from(participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Audio && pub.track
    );

    const audioIsOn = audioPublication ? !audioPublication.isMuted : false;
    const shouldShowVideo =
        !!cameraVideoPublication && !!cameraVideoPublication.track && !cameraVideoPublication.isMuted;

    const isSpeaking = useDebouncedSpeakingStatus(participant);

    const { borderColor } = getParticipantDisplayColors(participant);

    const speakingIndicatorClassName =
        (shouldShowVideo ? getParticipantDisplayColors({}).borderColor : borderColor) + (smallView ? '-small' : '');

    const isLocalParticipant = participant.identity === localParticipant.identity;

    // @ts-ignore
    const connectionQuality = participant._connectionQuality;

    const participantName = participantNameMap[participant.identity] ?? c('l10n_nightly Info').t`Loading...`;

    return (
        <div
            className={clsx(
                'participant-tile-body',
                'relative w-full h-full flex flex-nowrap items-center justify-center',
                smallView ? 'radius-small' : 'radius-normal'
            )}
        >
            <div
                className="absolute top-custom right-custom flex items-center justify-center gap-2"
                style={{
                    '--top-custom': smallView ? '0.5rem' : '1.25rem',
                    '--right-custom': smallView ? '0.5rem' : '1.25rem',
                }}
            >
                {isSpeaking && audioIsOn && <SpeakingIndicator size={32} participant={participant} />}
                {!audioIsOn && (
                    <div
                        className="flex items-center justify-center w-custom h-custom bg-weak rounded-full"
                        style={{
                            '--w-custom': '2rem',
                            '--h-custom': '2rem',
                            opacity: 0.8,
                        }}
                    >
                        <IcMeetMicrophoneOff size={4} />
                    </div>
                )}
                {shouldShowConnectionIndicator && <ConnectionIndicator connectionQuality={connectionQuality} />}
            </div>

            {isSpeaking && (
                <div
                    className={clsx(
                        'absolute top-0 left-0 w-full h-full z-up',
                        isSpeaking && speakingIndicatorClassName,
                        smallView ? 'radius-small' : 'radius-normal'
                    )}
                />
            )}

            {shouldShowVideo ? (
                <>
                    <div className="gradient-overlay absolute top-0 left-0 w-full h-full" />
                    <video
                        className="participant-tile-body__video bg-strong w-full h-full rounded-xl"
                        ref={(el) => {
                            if (el && cameraVideoPublication?.track) {
                                cameraVideoPublication.track.attach(el);
                            }
                        }}
                        muted={participant.isLocal}
                        style={{ transform: isLocalParticipant ? 'scaleX(-1)' : undefined }}
                    />
                </>
            ) : (
                <ParticipantPlaceholder participant={participant} smallView={smallView} />
            )}
            <div
                className="color-norm flex flex-nowrap items-center absolute left-custom bottom-custom z-up"
                style={{
                    '--left-custom': smallView ? '0.75rem' : '1.25rem',
                    '--bottom-custom': smallView ? '0.5rem' : '1.25rem',
                    gap: '0.625rem',
                }}
            >
                {participantName}
            </div>
        </div>
    );
};
