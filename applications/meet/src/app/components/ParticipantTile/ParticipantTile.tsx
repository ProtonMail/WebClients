import { memo, useEffect, useRef, useState } from 'react';

import { VideoTrack, useLocalParticipant, useParticipantTracks } from '@livekit/components-react';
import type { Participant, RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveReaction, selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    selectDisplayName,
    selectIsScreenShare,
    selectParticipantNameMap,
} from '@proton/meet/store/slices/meetingInfo';
import { selectMeetSettings, selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { RAISE_HAND_EMOJI } from '../../constants';
import { useCameraTrackSubscriptionManager } from '../../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDebouncedSpeakingStatus } from '../../hooks/useDebouncedSpeakingStatus';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { NetworkQualityIndicator } from '../NetworkQualityIndicator/NetworkQualityIndicator';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';

import './ParticipantTile.scss';

interface ParticipantTileProps {
    participant: Participant;
    viewSize?: 'xsmall' | 'small' | 'medium' | 'large' | 'midLarge';
}

const audioIconSize = {
    xsmall: '1.5rem',
    small: '1.5rem',
    medium: '1.5rem',
    large: '2rem',
    midLarge: '2rem',
};

const positionBySize = {
    xsmall: 0.375,
    small: 0.375,
    medium: 0.5,
    large: 1,
    midLarge: 1,
};

const indicatorSizeBySize = {
    xsmall: 24,
    small: 24,
    medium: 24,
    large: 32,
    midLarge: 32,
};

export const ParticipantTile = memo(({ participant, viewSize = 'large' }: ParticipantTileProps) => {
    const participantNameMap = useMeetSelector(selectParticipantNameMap);
    const displayName = useMeetSelector(selectDisplayName);
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const isScreenShare = useMeetSelector(selectIsScreenShare);
    const { register, unregister } = useCameraTrackSubscriptionManager();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const showReloadTrackButton = useFlag('MeetShowReloadTrackButton');

    const { localParticipant } = useLocalParticipant();

    const { facingMode } = useMediaManagementContext();
    const { disableVideos } = useMeetSelector(selectMeetSettings);

    const isSpeaking = useDebouncedSpeakingStatus(participant);
    const activeEmoji = useMeetSelector((state) => selectActiveReaction(state, participant.identity));
    const raisedHands = useMeetSelector(selectRaisedHands);
    const isHandRaised = raisedHands.includes(participant.identity);
    const displayEmoji = activeEmoji || (isHandRaised ? RAISE_HAND_EMOJI : undefined);

    // Track the last visible emoji synchronously during render so the exit class
    // is applied in the very same render where displayEmoji becomes undefined.
    const lastEmojiRef = useRef<string | undefined>(displayEmoji);
    if (displayEmoji) {
        lastEmojiRef.current = displayEmoji;
    }
    const [, setExitTick] = useState(0);
    const isExiting = !displayEmoji && !!lastEmojiRef.current;
    const emojiToRender = displayEmoji ?? (isExiting ? lastEmojiRef.current : undefined);

    useEffect(() => {
        if (!displayEmoji && lastEmojiRef.current) {
            const timer = setTimeout(() => {
                lastEmojiRef.current = undefined;
                setExitTick((n) => n + 1);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [displayEmoji]);

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

    const {
        participantColors: { borderColor, backgroundColor, profileColor },
    } = useParticipantDisplayColors(participant.identity);

    const shouldShowVideo =
        cameraIsOn &&
        ((!disableVideos && !participantsWithDisabledVideos.includes(participant.identity)) ||
            participant.identity === localParticipant.identity);

    const speakingIndicatorClassName =
        (shouldShowVideo ? 'tile-border-1' : borderColor) + (viewSize === 'large' ? '' : '-small');

    const isLocalParticipant = participant.identity === localParticipant.identity;

    const participantName =
        participantNameMap[participant.identity] ?? (isLocalParticipant ? displayName : c('Info').t`Loading...`);

    const { width, height } = cameraVideoPublication?.dimensions ?? {
        width: 0,
        height: 0,
    };
    const isVideoVertical = width < height;

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

    const handleRefreshTracks = async () => {
        if (isRefreshing) {
            return;
        }

        setIsRefreshing(true);
        try {
            // Resubscribe video track
            if (cameraVideoPublication) {
                const videoPub = cameraVideoPublication as RemoteTrackPublication;
                const wasSubscribed = videoPub.isSubscribed;
                const wasEnabled = videoPub.isEnabled;

                if (wasSubscribed) {
                    videoPub.setSubscribed(false);
                    await wait(isSafari() ? 500 : 200);
                }

                if (wasSubscribed) {
                    videoPub.setSubscribed(true);
                    await wait(isSafari() ? 500 : 200);
                }

                if (wasEnabled !== undefined) {
                    videoPub.setEnabled(wasEnabled);
                    await wait(isSafari() ? 200 : 50);
                }
            }

            // Resubscribe audio track
            if (audioPublication) {
                const audioPub = audioPublication as RemoteTrackPublication;
                const wasSubscribed = audioPub.isSubscribed;
                const wasEnabled = audioPub.isEnabled;

                if (wasSubscribed) {
                    audioPub.setSubscribed(false);
                    await wait(isSafari() ? 500 : 200);
                }

                if (wasSubscribed) {
                    audioPub.setSubscribed(true);
                    await wait(isSafari() ? 500 : 200);
                }

                if (wasEnabled !== undefined) {
                    audioPub.setEnabled(wasEnabled);
                    await wait(isSafari() ? 200 : 50);
                }
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to refresh tracks', error);
        } finally {
            setIsRefreshing(false);
        }
    };

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
                {/* Reload track button for non-local participants on top right corner when noone is screen sharing */}
                {!isLocalParticipant && showReloadTrackButton && !isScreenShare && (
                    <button
                        className={clsx(
                            'user-select-none flex items-center justify-center w-custom h-custom bg-weak rounded-full border-none cursor-pointer transition-opacity',
                            isRefreshing ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                        )}
                        style={{
                            '--w-custom': audioIconSize[viewSize],
                            '--h-custom': audioIconSize[viewSize],
                        }}
                        onClick={handleRefreshTracks}
                        disabled={isRefreshing}
                        aria-label={c('Action').t`Refresh audio and video tracks`}
                        title={c('Info').t`Refresh audio and video tracks`}
                    >
                        <IcArrowsRotate
                            size={viewSize === 'large' ? 4 : 3}
                            className={clsx(isRefreshing && 'animate-spin')}
                        />
                    </button>
                )}
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

            {/* Reload track button for non-local participants on bottom right corner when someone is screen share */}
            {!isLocalParticipant && showReloadTrackButton && isScreenShare && (
                <button
                    className={clsx(
                        'absolute z-up user-select-none flex items-center justify-center w-custom h-custom bg-weak rounded-full border-none cursor-pointer transition-opacity',
                        isRefreshing ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                    )}
                    style={{
                        '--w-custom': audioIconSize[viewSize],
                        '--h-custom': audioIconSize[viewSize],
                        bottom: `${positionBySize[viewSize]}rem`,
                        right: `${positionBySize[viewSize]}rem`,
                    }}
                    onClick={handleRefreshTracks}
                    disabled={isRefreshing}
                    aria-label={c('Action').t`Refresh audio and video tracks`}
                    title={c('Info').t`Refresh audio and video tracks`}
                >
                    <IcArrowsRotate
                        size={viewSize === 'large' ? 4 : 3}
                        className={clsx(isRefreshing && 'animate-spin')}
                    />
                </button>
            )}

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
                        className={clsx(
                            'participant-tile-body__video w-full h-full rounded-xl',
                            isVideoVertical && 'vertical-video'
                        )}
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
            {emojiToRender && (
                <div
                    className={clsx(
                        'absolute z-up participant-tile-emoji pointer-events-none',
                        isExiting && 'participant-tile-emoji--exit'
                    )}
                    style={{
                        top: `${positionBySize[viewSize]}rem`,
                        left: `${positionBySize[viewSize]}rem`,
                    }}
                >
                    {emojiToRender}
                </div>
            )}
            <div
                className={clsx(
                    'color-norm absolute left-custom bottom-custom participant-tile-name max-w-custom flex flex-nowrap items-center',
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
                    smallIcon={viewSize === 'xsmall' || viewSize === 'small'}
                />
                <span className={clsx('text-ellipsis', viewSize === 'xsmall' && 'text-sm')}>{participantName}</span>
            </div>
        </div>
    );
});

ParticipantTile.displayName = 'ParticipantTile';
