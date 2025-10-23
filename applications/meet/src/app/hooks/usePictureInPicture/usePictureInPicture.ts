import { useCallback, useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { isChromiumBased, isFirefox, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import type { MeetChatMessage } from '../../types';
import { PiPSessionManager } from './PiPSessionManager';
import { useLatest } from './useLatest';
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
    chatMessages,
}: {
    isDisconnected: boolean;
    participantNameMap: Record<string, string>;
    chatMessages: MeetChatMessage[];
}) {
    const room = useRoomContext();

    const { toggleVideo, toggleAudio, isVideoEnabled, isAudioEnabled, selectedMicrophoneId, selectedCameraId } =
        useMediaManagementContext();

    const [isPipActive, setIsPipActive] = useState(false);

    // Use useLatest to avoid stale closures
    const participantNameMapRef = useLatest(participantNameMap);

    const notifications = useNotifications();

    // Use the smaller hooks
    const { messages, addSystemMessage, addChatMessage } = usePiPMessages();
    const { tracksForDisplay } = usePiPTracks();
    const { startRendering, stopRendering } = usePiPRenderer();

    // PiP session manager for resource management
    const sessionManager = useRef(new PiPSessionManager());
    const preventBlur = useRef(false);

    // Use specialized hooks
    const { setupMediaSession } = usePiPMediaSession({
        isVideoEnabled,
        isAudioEnabled,
        toggleVideo,
        toggleAudio,
        videoDeviceId: selectedCameraId || undefined,
        audioDeviceId: selectedMicrophoneId || undefined,
    });

    const pipCleanup = useCallback(async () => {
        stopRendering();
        await sessionManager.current.destroy();
    }, [stopRendering]);

    // Stop PiP - properly async and awaits cleanup
    const stopPiP = useCallback(async () => {
        if (!isSafari()) {
            // Non-Safari: Stop rendering and destroy all resources
            await pipCleanup();
        } else {
            startRendering(
                sessionManager.current.getCanvas() as HTMLCanvasElement,
                tracksForDisplay,
                messages,
                participantNameMapRef.current,
                true
            );
            await sessionManager.current.exitPictureInPicture();
        }

        setIsPipActive(false);
    }, [stopRendering, startRendering, tracksForDisplay, messages, participantNameMapRef]);

    const pipSetup = async (throttle: boolean = false) => {
        if (isMobile()) {
            return;
        }

        // Initialize session with canvas and video elements
        const { canvas } = sessionManager.current.init(tracksForDisplay);

        // Start rendering (only when PiP is active)
        startRendering(canvas, tracksForDisplay, messages, participantNameMapRef.current, throttle);

        // Setup video stream and request PiP
        await sessionManager.current.setupVideoStream();
    };

    // Start PiP
    const startPiP = useCallback(async () => {
        try {
            if (isMobile() || isPipActive) {
                return;
            }

            // In Safari the setup is already done
            if (!isSafari()) {
                await pipSetup(false);
            }

            if (!isFirefox()) {
                await sessionManager.current.requestPictureInPicture();
            }

            setIsPipActive(true);

            // Setup MediaSession
            setupMediaSession();

            // Listen for PiP end - properly await the async stopPiP
            sessionManager.current.addPiPEndListener(() => {
                void stopPiP();
            });

            return;
        } catch (error) {
            notifications.createNotification({
                type: 'error',
                text: c('meet_2025 Error').t`Failed to start Picture-in-Picture`,
            });
            void stopPiP();
        } finally {
            preventBlur.current = false;
        }
    }, [
        isPipActive,
        tracksForDisplay,
        notifications,
        startRendering,
        messages,
        setIsPipActive,
        setupMediaSession,
        stopPiP,
    ]);

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
            addChatMessage(lastMessage.name, lastMessage.message);
        }
    }, [chatMessages, addChatMessage]);

    // Unified effect to handle rendering when PiP is active
    useEffect(() => {
        if (!isPipActive || !sessionManager.current.isInitialized()) {
            return;
        }
        const canvas = sessionManager.current.getCanvas();
        if (canvas) {
            // Restart rendering loop with the latest tracks to avoid stale closures
            stopRendering();
            startRendering(canvas, tracksForDisplay, messages, participantNameMapRef.current, false);
        }
    }, [isPipActive, tracksForDisplay, messages, startRendering, stopRendering]);

    useEffect(() => {
        if (!isChromiumBased() || isMobile()) {
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

                if (leftBrowser && isScreenShareActive && !isPipActive) {
                    await startPiP();
                }
            }, 200);
        };

        window.addEventListener('blur', handleWindowBlur);
        return () => {
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [startPiP, isPipActive, room]);

    useEffect(() => {
        try {
            if ('mediaSession' in navigator && isChromiumBased() && !isMobile()) {
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
    }, [startPiP]);

    const prevMediaStatus = useRef(isVideoEnabled || isAudioEnabled);
    // Setting up a silent audio stream to be able to use enterpictureinpicture in Chromium based browsers
    useEffect(() => {
        const currentMediaStatus = isVideoEnabled || isAudioEnabled;

        if (!isChromiumBased() || isMobile() || currentMediaStatus) {
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
    }, [room, isVideoEnabled, isAudioEnabled]);

    return {
        startPiP,
        stopPiP,
        isPipActive,
        canvas: sessionManager.current.getCanvas(),
        tracksLength: tracksForDisplay.length,
        pipSetup,
        pipCleanup,
        preparePictureInPicture,
    };
}
