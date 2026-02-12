import { useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessages } from '@proton/meet/store/slices/meetingState';
import { selectMeetSettings } from '@proton/meet/store/slices/settings';
import { isChromiumBased, isFirefox, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import { useCameraTrackSubscriptionManager } from '../../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useLatest } from '../useLatest';
import { useStableCallback } from '../useStableCallback';
import { PiPSessionManager } from './PiPSessionManager';
import type { TrackInfo } from './types';
import { usePiPMediaSession } from './usePiPMediaSession';
import { usePiPMessages } from './usePiPMessages';
import { usePiPRenderer } from './usePiPRenderer';
import { usePiPTracks } from './usePiPTracks';

const enableMediaSessionControls = async () => {
    try {
        const silentStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });

        silentStream.getAudioTracks().forEach((track) => {
            track.enabled = false;
        });

        return silentStream;
    } catch (error) {
        return null;
    }
};

export function usePictureInPicture({
    isDisconnected,
    participantNameMap,
}: {
    isDisconnected: boolean;
    participantNameMap: Record<string, string>;
}) {
    const room = useRoomContext();

    const chatMessages = useMeetSelector(selectChatMessages);

    const { sortedParticipants } = useSortedParticipantsContext();

    const { toggleVideo, toggleAudio, isVideoEnabled, isAudioEnabled, selectedMicrophoneId, selectedCameraId } =
        useMediaManagementContext();

    const { pipEnabled } = useMeetSelector(selectMeetSettings);

    const [isPipActive, setIsPipActive] = useState(false);

    // Use useLatest to avoid stale closures
    const participantNameMapRef = useLatest(participantNameMap);

    const notifications = useNotifications();

    // Use the smaller hooks
    const { messages, addSystemMessage, addChatMessage } = usePiPMessages();
    const { tracksForDisplay, tracksKey } = usePiPTracks(sortedParticipants);
    const { startRendering, stopRendering } = usePiPRenderer();

    const displayableWithAvailableTracks = tracksForDisplay.filter((track) => track.track !== undefined) as TrackInfo[];

    const { register, removeForcePin } = useCameraTrackSubscriptionManager();

    // PiP session manager for resource management
    const [sessionManager] = useState(() => new PiPSessionManager());

    const preventBlur = useRef(false);

    const isPipActiveRef = useRef(isPipActive);

    isPipActiveRef.current = isPipActive;

    const prevTracksForDisplayRef = useRef(tracksForDisplay);

    // Use specialized hooks
    const { setupMediaSession } = usePiPMediaSession({
        isVideoEnabled,
        isAudioEnabled,
        toggleVideo,
        toggleAudio,
        videoDeviceId: selectedCameraId || undefined,
        audioDeviceId: selectedMicrophoneId || undefined,
    });

    const pipCleanup = async () => {
        stopRendering();
        await sessionManager.destroy();
    };

    const pictureInPictureWarmup = async () => {
        if (isMobile()) {
            return;
        }
        await sessionManager.pictureInPictureWarmup();
    };

    // Stop PiP - properly async and awaits cleanup
    const stopPiP = async () => {
        await pipCleanup();

        // Safari needs a warmup so we can pass strict Safari PiP requirements
        if (isSafari()) {
            void pictureInPictureWarmup();
        }

        setIsPipActive(false);
    };

    const pipSetup = async () => {
        if (isMobile() || !pipEnabled) {
            return;
        }

        // Initialize session with canvas and video elements
        const { canvas } = sessionManager.init(displayableWithAvailableTracks) || {};

        startRendering(canvas, displayableWithAvailableTracks, messages, participantNameMapRef.current);
        await sessionManager.setupVideoStream();
    };

    // Start PiP
    const startPiP = useStableCallback(async () => {
        if (!pipEnabled) {
            return;
        }

        try {
            if (isMobile() || isPipActive) {
                return;
            }

            if (isSafari()) {
                const video = sessionManager.getVideo();
                if (video?.paused) {
                    video.play().catch(() => {});
                }

                await sessionManager.requestPictureInPicture();
                await pipSetup();
            } else {
                await pipSetup();

                if (!isFirefox()) {
                    await sessionManager.requestPictureInPicture();
                }
            }

            setIsPipActive(true);

            // Setup MediaSession
            setupMediaSession();

            // Listen for PiP end - properly await the async stopPiP
            sessionManager.addPiPEndListener(() => {
                void stopPiP();
            });

            return;
        } catch (error: any) {
            if (!error.message.includes('user gesture')) {
                notifications.createNotification({
                    type: 'error',
                    text: c('meet_2025 Error').t`Failed to start Picture-in-Picture`,
                });
            }

            void stopPiP();
        } finally {
            preventBlur.current = false;
        }
    });

    const preparePictureInPicture = () => {
        preventBlur.current = true;
    };

    // Effect to handle disconnection
    useEffect(() => {
        if (isDisconnected) {
            addSystemMessage('Disconnected, please reconnect.', 'error');
        }
    }, [isDisconnected, addSystemMessage]);

    // Effect to handle chat messages
    useEffect(() => {
        if (chatMessages.length > 0) {
            const lastMessage = chatMessages[chatMessages.length - 1];
            addChatMessage(participantNameMapRef.current[lastMessage.identity], lastMessage.message);
        }
    }, [chatMessages, addChatMessage]);

    // Unified effect to handle rendering when PiP is active
    useEffect(() => {
        if (!isPipActive || !sessionManager.isInitialized()) {
            return;
        }
        const canvas = sessionManager.getCanvas();
        if (canvas) {
            const tracksToUnregister = prevTracksForDisplayRef.current.filter(
                (track) =>
                    !tracksForDisplay.find((t) => t.publication.trackSid === track.publication.trackSid) &&
                    !track.isScreenShare
            );

            tracksToUnregister.forEach((track) => {
                removeForcePin(track.publication);
            });

            tracksForDisplay.forEach((track) => {
                if (!track.isScreenShare) {
                    register(track.publication, track.participant.identity, true);
                }
            });

            prevTracksForDisplayRef.current = tracksForDisplay;

            // Restart rendering loop with the latest tracks to avoid stale closures
            stopRendering();
            startRendering(canvas, displayableWithAvailableTracks, messages, participantNameMapRef.current);
        }
    }, [sessionManager, isPipActive, tracksKey, messages, startRendering, stopRendering]);

    useEffect(() => {
        if (!isChromiumBased() || isMobile() || !pipEnabled) {
            return;
        }

        const isScreenShareActive = [room.localParticipant, ...Array.from(room.remoteParticipants.values())].some(
            (participant) => participant.isScreenShareEnabled
        );

        const handleWindowBlur = () => {
            if (preventBlur.current) {
                return;
            }

            setTimeout(async () => {
                const isTabSwitch = document.hidden;
                const leftBrowser = !document.hasFocus() && !isTabSwitch;

                if (leftBrowser && isScreenShareActive && !isPipActiveRef.current) {
                    await startPiP();
                }
            }, 200);
        };

        window.addEventListener('blur', handleWindowBlur);
        return () => {
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [startPiP, isPipActive, room, pipEnabled]);

    useEffect(() => {
        try {
            if ('mediaSession' in navigator && isChromiumBased() && !isMobile() && pipEnabled) {
                // @ts-ignore - Only available in Chrome
                navigator.mediaSession.setActionHandler('enterpictureinpicture', async () => {
                    const isScreenShareActive = [
                        room.localParticipant,
                        ...Array.from(room.remoteParticipants.values()),
                    ].some((participant) => participant.isScreenShareEnabled);

                    if (isScreenShareActive && !preventBlur.current) {
                        await startPiP();
                    }
                });

                return () => {
                    // @ts-ignore - Only available in Chrome
                    navigator.mediaSession.setActionHandler('enterpictureinpicture', null);
                };
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }, [startPiP, pipEnabled]);

    const prevMediaStatus = useRef(isVideoEnabled || isAudioEnabled);
    // Setting up a silent audio stream to be able to use enterpictureinpicture in Chromium based browsers
    useEffect(() => {
        const currentMediaStatus = isVideoEnabled || isAudioEnabled;

        if (!isChromiumBased() || isMobile() || currentMediaStatus || !pipEnabled) {
            return;
        }

        let silentStream: MediaStream | null = null;

        const handleCreateSilentStream = async () => {
            silentStream = await enableMediaSessionControls();
        };

        const handleDestroySilentStream = () => {
            if (silentStream) {
                silentStream.getTracks().forEach((track) => track.stop());
                silentStream = null;
            }
        };

        if (prevMediaStatus.current && !currentMediaStatus) {
            handleDestroySilentStream();
        }

        if (!prevMediaStatus.current && currentMediaStatus) {
            void handleCreateSilentStream();
        }

        room.on('connected', handleCreateSilentStream);
        room.on('disconnected', handleDestroySilentStream);

        prevMediaStatus.current = currentMediaStatus;

        return () => {
            room.off('connected', handleCreateSilentStream);
            room.off('disconnected', handleDestroySilentStream);

            if (silentStream) {
                silentStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [room, isVideoEnabled, isAudioEnabled, pipEnabled]);

    return {
        startPiP,
        stopPiP,
        isPipActive,
        canvas: sessionManager.getCanvas(),
        tracksLength: tracksForDisplay.length,
        pictureInPictureWarmup,
        pipCleanup,
        preparePictureInPicture,
    };
}
