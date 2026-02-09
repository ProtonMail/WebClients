import { useEffect } from 'react';

import { VideoTrack, useLocalParticipant, useParticipantTracks } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetSettings, selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useCameraTrackSubscriptionManager } from '../../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useDebouncedSpeakingStatus } from '../../hooks/useDebouncedSpeakingStatus';
import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';
import { NetworkQualityIndicator } from '../NetworkQualityIndicator/NetworkQualityIndicator';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';

import './ParticipantTile.scss';

interface ParticipantTileProps {
    participant: Participant;
    viewSize?: 'small' | 'medium' | 'large';
}

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
    const { participantNameMap, displayName } = useMeetContext();
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const { register, unregister } = useCameraTrackSubscriptionManager();

    const { localParticipant } = useLocalParticipant();

    const { sortedParticipantsDisplayColorsMap } = useSortedParticipantsContext();
    const { facingMode } = useMediaManagementContext();
    const { disableVideos } = useMeetSelector(selectMeetSettings);

    const isSpeaking = useDebouncedSpeakingStatus(participant);

    // Use useParticipantTracks to get camera tracks for this specific participant
    // This properly subscribes to track state changes
    const cameraTrackRefs = useParticipantTracks([Track.Source.Camera], participant.identity);
    const cameraTrackRef = cameraTrackRefs[0];
    const cameraVideoPublication = cameraTrackRef?.publication;

    const audioTrackRefs = useParticipantTracks([Track.Source.Microphone], participant.identity);
    const audioTrackRef = audioTrackRefs[0];
    const audioPublication = audioTrackRef?.publication;

    const audioIsOn = audioPublication?.track && !audioPublication?.track?.isMuted;

    const cameraIsOn = cameraVideoPublication?.track && !cameraVideoPublication?.track?.isMuted;

    const { borderColor, backgroundColor, profileColor } = sortedParticipantsDisplayColorsMap.get(
        participant.identity
    ) ?? { borderColor: 'tile-border-1', backgroundColor: 'meet-background-1', profileColor: 'profile-color-1' };

    const shouldShowVideo =
        cameraIsOn &&
        ((!disableVideos && !participantsWithDisabledVideos.includes(participant.identity)) ||
            participant.identity === localParticipant.identity);

    const speakingIndicatorClassName =
        (shouldShowVideo ? getParticipantDisplayColors({}).borderColor : borderColor) +
        (viewSize === 'large' ? '' : '-small');

    const isLocalParticipant = participant.identity === localParticipant.identity;

    const participantName =
        participantNameMap[participant.identity] ?? (isLocalParticipant ? displayName : c('Info').t`Loading...`);

    // Queue-based subscription: ParticipantTile enqueues work by registering the remote publication.
    // Provider is responsible for subscribing/enabling/quality selection & stuck resets.
    useEffect(() => {
        if (cameraVideoPublication?.trackSid && participant.identity) {
            register(cameraVideoPublication, participant.identity);
            return () => {
                unregister(cameraVideoPublication);
            };
        }
        // Intentionally track sid so we cleanup/re-register on publication changes.
    }, [cameraVideoPublication?.trackSid, participant.identity, register, unregister]);

    return (
        <div
            className={clsx(
                'participant-tile-body',
                'relative w-full h-full flex flex-nowrap items-center justify-center',
                viewSize === 'large' ? 'radius-normal' : 'radius-small'
            )}
        >
            <div
                className="absolute top-custom right-custom flex items-center justify-center gap-2 z-up"
                style={{
                    '--top-custom': `${positionBySize[viewSize]}rem`,
                    '--right-custom': `${positionBySize[viewSize]}rem`,
                }}
            >
                <NetworkQualityIndicator
                    size={indicatorSizeBySize[viewSize]}
                    participant={participant}
                    indicatorSize={(2 / 3) * indicatorSizeBySize[viewSize]}
                />
                {audioIsOn && (
                    <SpeakingIndicator
                        size={indicatorSizeBySize[viewSize]}
                        participant={participant}
                        indicatorSize={(2 / 3) * indicatorSizeBySize[viewSize]}
                        stopped={!isSpeaking}
                        opacity
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
                    <div className="gradient-overlay absolute top-0 left-0 w-full h-full z-1" />
                    <VideoTrack
                        key={cameraVideoPublication?.trackSid}
                        className="participant-tile-body__video bg-strong w-full h-full rounded-xl"
                        trackRef={cameraTrackRef}
                        manageSubscription={false}
                        muted={participant.isLocal}
                        style={{
                            transform:
                                isLocalParticipant && !(isSafari() && isMobile()) && facingMode === 'user'
                                    ? 'scaleX(-1)'
                                    : undefined,
                        }}
                        autoPlay={true}
                        playsInline={true}
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
                    'color-norm absolute left-custom bottom-custom participant-tile-name text-ellipsis max-w-custom flex',
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
