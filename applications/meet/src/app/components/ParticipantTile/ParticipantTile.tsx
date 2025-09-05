import { useLocalParticipant } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import { IcMeetMicrophoneOff } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMeetContext } from '../../contexts/MeetContext';
import { useDebouncedSpeakingStatus } from '../../hooks/useDebouncedSpeakingStatus';
import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';

import './ParticipantTile.scss';

interface ParticipantTileProps {
    participant: Participant;
    viewSize?: 'small' | 'medium' | 'large';
}

const getCameraVideoPublication = (participant: Participant) => {
    return Array.from(participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Video && pub.source !== Track.Source.ScreenShare && pub.track
    );
};

const audioIconSize = {
    small: '1.5rem',
    medium: '1.5rem',
    large: '2rem',
};

const positionBySize = {
    small: 0.375,
    medium: 0.5,
    large: 1,
};

const indicatorSizeBySize = {
    small: 24,
    medium: 24,
    large: 32,
};

export const ParticipantTile = ({ participant, viewSize = 'large' }: ParticipantTileProps) => {
    const { localParticipant } = useLocalParticipant();
    const { participantNameMap, disableVideos, participantsWithDisabledVideos, displayName } = useMeetContext();
    const cameraVideoPublication = getCameraVideoPublication(participant);

    const audioPublication = Array.from(participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Audio && pub.track
    );

    const audioIsOn = audioPublication ? !audioPublication.isMuted : false;
    const shouldShowVideo =
        !!cameraVideoPublication &&
        !!cameraVideoPublication.track &&
        !cameraVideoPublication.isMuted &&
        ((!disableVideos && !participantsWithDisabledVideos.includes(participant.identity)) || participant.isLocal);

    const isSpeaking = useDebouncedSpeakingStatus(participant);

    const { borderColor, backgroundColor, profileColor } = getParticipantDisplayColors(participant);

    const speakingIndicatorClassName =
        (shouldShowVideo ? getParticipantDisplayColors({}).borderColor : borderColor) +
        (viewSize === 'large' ? '' : '-small');

    const isLocalParticipant = participant.identity === localParticipant.identity;

    const participantNameFallback =
        participant.identity === localParticipant.identity ? displayName : c('Info').t`Loading...`;

    const participantName = participantNameMap[participant.identity] ?? participantNameFallback;

    return (
        <div
            className={clsx(
                'participant-tile-body',
                'relative w-full h-full flex flex-nowrap items-center justify-center',
                viewSize === 'large' ? 'radius-normal' : 'radius-small'
            )}
        >
            <div
                className="absolute top-custom right-custom flex items-center justify-center gap-2"
                style={{
                    '--top-custom': `${positionBySize[viewSize]}rem`,
                    '--right-custom': `${positionBySize[viewSize]}rem`,
                }}
            >
                {isSpeaking && audioIsOn && (
                    <SpeakingIndicator
                        size={indicatorSizeBySize[viewSize]}
                        participant={participant}
                        indicatorSize={(2 / 3) * indicatorSizeBySize[viewSize]}
                    />
                )}
                {!audioIsOn && (
                    <div
                        className="user-select-none flex items-center justify-center w-custom h-custom bg-weak rounded-full"
                        style={{
                            '--w-custom': audioIconSize[viewSize],
                            '--h-custom': audioIconSize[viewSize],
                            opacity: 0.8,
                        }}
                    >
                        <IcMeetMicrophoneOff size={viewSize === 'large' ? 4 : 3} />
                    </div>
                )}
            </div>

            {isSpeaking && (
                <div
                    className={clsx(
                        'speaker-border absolute top-0 left-0 w-full h-full',
                        speakingIndicatorClassName,
                        viewSize === 'large' ? 'radius-normal' : 'radius-small'
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
                <ParticipantPlaceholder
                    participantName={participantName}
                    viewSize={viewSize}
                    backgroundColor={backgroundColor}
                    profileColor={profileColor}
                />
            )}
            <div
                className={clsx(
                    'color-norm absolute left-custom bottom-custom participant-tile-name text-ellipsis max-w-custom',
                    viewSize !== 'large' && 'text-sm'
                )}
                style={{
                    '--left-custom': `${1.25 * positionBySize[viewSize]}rem`,
                    '--bottom-custom': `${positionBySize[viewSize]}rem`,
                    '--max-w-custom': '85%',
                }}
                title={participantName}
            >
                <SecurityShield
                    title={c('Info').t`End-to-end encryption is active for audio and video.`}
                    smallIcon={viewSize === 'small'}
                />
                {participantName}
            </div>
        </div>
    );
};
