import { memo, useEffect, useRef, useState } from 'react';

import { VideoTrack, useLocalParticipant, useParticipantTracks } from '@livekit/components-react';
import type { Participant, RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectInitialCameraState,
    selectIsMediaInitializing,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { selectDisplayName } from '@proton/meet/store/slices/meetingInfo';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectMeetSettings, selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useCameraTrackSubscriptionManager } from '../../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDebouncedSpeakingStatus } from '../../hooks/useDebouncedSpeakingStatus';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { shouldShowParticipantVideo } from '../../utils/shouldShowParticipantVideo';
import { BackgroundEffectInitializingOverlay } from '../BackgroundEffectInitializingOverlay/BackgroundEffectInitializingOverlay';
import { NetworkQualityIndicator } from '../NetworkQualityIndicator/NetworkQualityIndicator';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';
import { ParticipantTileReaction } from './ParticipantTileReaction';
import { AUDIO_ICON_SIZE, INDICATOR_SIZE_BY_SIZE, POSITION_BY_SIZE } from './constants';

import './ParticipantTile.scss';

interface ParticipantTileProps {
    participant: Participant;
    viewSize?: 'xsmall' | 'small' | 'medium' | 'large' | 'midLarge';
}

export const ParticipantTile = memo(({ participant, viewSize = 'large' }: ParticipantTileProps) => {
    const displayName = useMeetSelector(selectDisplayName);
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const isScreenShare = useMeetSelector(selectIsScreenShare);
    const { register, unregister } = useCameraTrackSubscriptionManager();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const showReloadTrackButton = useFlag('MeetShowReloadTrackButton');

    const { localParticipant } = useLocalParticipant();

    const isLocalParticipant = participant.identity === localParticipant.identity;

    const { facingMode } = useMediaManagementContext();
    const { disableVideos } = useMeetSelector(selectMeetSettings);

    // Suppress the local self-view only during that init window, afterwards it follows the real camera state
    const isMediaInitializing = useMeetSelector(selectIsMediaInitializing);
    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const isLocalVideoSuppressed = isMediaInitializing && !initialCameraState;

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

    const {
        participantColors: { borderColor, backgroundColor, profileColor },
    } = useParticipantDisplayColors(participant.identity);

    const shouldShowVideo = shouldShowParticipantVideo({
        cameraIsOn: !!cameraIsOn,
        isLocalParticipant,
        isLocalVideoSuppressed,
        isVideoDisabled: disableVideos || participantsWithDisabledVideos.includes(participant.identity),
    });

    const speakingIndicatorClassName =
        (shouldShowVideo ? 'tile-border-1' : borderColor) + (viewSize === 'large' ? '' : '-small');

    const participantName =
        useMeetSelector((state) => selectParticipantName(state, participant.identity)) ??
        (isLocalParticipant ? displayName : c('Info').t`Loading...`);

    const audioStateLabel = audioIsOn ? c('Accessibility').t`microphone on` : c('Accessibility').t`microphone muted`;
    const videoStateLabel = shouldShowVideo ? c('Accessibility').t`camera on` : c('Accessibility').t`camera off`;
    const tileAriaLabel = `${participantName}, ${audioStateLabel}, ${videoStateLabel}`;

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoVertical, setIsVideoVertical] = useState(false);

    // Derive orientation from the rendered video element's intrinsic size rather than publication.dimensions
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!shouldShowVideo || !videoEl) {
            return;
        }

        const updateOrientation = () => {
            const { videoWidth, videoHeight } = videoEl;

            if (videoWidth && videoHeight) {
                setIsVideoVertical(videoWidth < videoHeight);
            }
        };

        updateOrientation();
        videoEl.addEventListener('loadedmetadata', updateOrientation);
        videoEl.addEventListener('resize', updateOrientation);
        return () => {
            videoEl.removeEventListener('loadedmetadata', updateOrientation);
            videoEl.removeEventListener('resize', updateOrientation);
        };
    }, [cameraVideoPublication?.trackSid, shouldShowVideo]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            aria-label={tileAriaLabel}
            className={clsx(
                'participant-tile-body',
                'relative w-full h-full flex flex-nowrap items-center justify-center',
                viewSize === 'large' ? 'radius-normal' : 'radius-small'
            )}
            role="group"
        >
            <div
                className="absolute top-custom right-custom flex items-center justify-center gap-2 z-up"
                style={{
                    '--top-custom': `${POSITION_BY_SIZE[viewSize]}rem`,
                    '--right-custom': `${POSITION_BY_SIZE[viewSize]}rem`,
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
                            '--w-custom': AUDIO_ICON_SIZE[viewSize],
                            '--h-custom': AUDIO_ICON_SIZE[viewSize],
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
                    size={INDICATOR_SIZE_BY_SIZE[viewSize]}
                    participant={participant}
                    indicatorSize={(2 / 3) * INDICATOR_SIZE_BY_SIZE[viewSize]}
                />
                {audioIsOn && (
                    <SpeakingIndicator
                        size={INDICATOR_SIZE_BY_SIZE[viewSize]}
                        participant={participant}
                        indicatorSize={(2 / 3) * INDICATOR_SIZE_BY_SIZE[viewSize]}
                        stopped={!isSpeaking}
                        opacity
                    />
                )}
                {!audioIsOn && (
                    <div
                        aria-hidden="true"
                        className="user-select-none flex items-center justify-center w-custom h-custom bg-weak rounded-full"
                        style={{
                            '--w-custom': AUDIO_ICON_SIZE[viewSize],
                            '--h-custom': AUDIO_ICON_SIZE[viewSize],
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
                        '--w-custom': AUDIO_ICON_SIZE[viewSize],
                        '--h-custom': AUDIO_ICON_SIZE[viewSize],
                        bottom: `${POSITION_BY_SIZE[viewSize]}rem`,
                        right: `${POSITION_BY_SIZE[viewSize]}rem`,
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
                        ref={videoRef}
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
                    {isLocalParticipant && <BackgroundEffectInitializingOverlay viewSize={viewSize} />}
                </>
            ) : (
                <ParticipantPlaceholder
                    participantName={participantName}
                    viewSize={viewSize}
                    backgroundColor={backgroundColor}
                    profileColor={profileColor}
                />
            )}
            <ParticipantTileReaction participantIdentity={participant.identity} position={POSITION_BY_SIZE[viewSize]} />
            <div
                aria-hidden="true"
                className={clsx(
                    'color-norm absolute left-custom bottom-custom participant-tile-name max-w-custom flex flex-nowrap items-center',
                    viewSize !== 'large' && 'text-sm'
                )}
                style={{
                    '--left-custom': `${1.25 * POSITION_BY_SIZE[viewSize]}rem`,
                    '--bottom-custom': `${POSITION_BY_SIZE[viewSize]}rem`,
                    '--max-w-custom': '85%',
                }}
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
