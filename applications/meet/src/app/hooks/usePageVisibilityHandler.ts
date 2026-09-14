import { useEffect, useRef } from 'react';

import { useMeetErrorReporting } from '@proton/meet';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { useCameraTrackSubscriptionManager } from '../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';
import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';

interface UsePageVisibilityHandlerParams {
    joinedRoom: boolean;
    isPipActive: boolean;
}

/**
 * Hook to handle Safari websocket ping/pong settings, media playback, and video subscriptions when page visibility changes.
 * When in background:
 *   - Safari only: sets websocket parameters to 60 seconds to prevent disconnection
 *   - Unsubscribes all video tracks to save bandwidth and resources (with debounce)
 * When returning to foreground:
 *   - Safari only: resets websocket parameters to null (default)
 *   - Safari only: resumes paused audio and video elements that were created while in background
 *   - Resubscribes all video tracks (with debounce)
 *
 * The video pause runs everywhere: adaptiveStream's visibility signal is IntersectionObserver
 * based and does not re-fire on a backgrounded tab. It stays in this handler so the setEnabled
 * burst cannot reach the socket while Safari is still reconfiguring the websocket.
 */
export const usePageVisibilityHandler = ({ joinedRoom, isPipActive }: UsePageVisibilityHandlerParams) => {
    const meetCoreClient = useMeetCoreClient();

    const { reportMeetError } = useMeetErrorReporting();
    const { unsubscribeAllVideos, resubscribeAllVideos } = useCameraTrackSubscriptionManager();
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isCpuOptimizations = useFlag('MeetCpuOptimizations');
    // Safari already paused video here before the flag existed, so it keeps doing so regardless.
    const handlesVideoSubscriptions = isSafari() || isCpuOptimizations;

    const DEBOUNCE_DELAY = 500; // 500ms debounce to avoid rapid toggle

    useEffect(() => {
        if (!joinedRoom || !handlesVideoSubscriptions) {
            return;
        }

        const handleVisibilityChange = async () => {
            // Clear any pending debounce timeout
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }

            // Immediate actions (no debounce needed)
            if (document.visibilityState === 'hidden') {
                // Page is in background, set websocket parameters to 60 and max ping failures to 3
                // This is to prevent the websocket from being closed due to inactivity
                try {
                    await meetCoreClient.setWebsocketPingInterval(60n);
                    await meetCoreClient.setWebsocketPongTimeout(60n);
                    await meetCoreClient.setWebsocketMaxPingFailures(3);
                } catch (error) {
                    reportMeetError('Failed to set websocket parameters for background', error);
                }

                // Picture-in-Picture keeps rendering remote cameras from a hidden tab,
                // so pausing freezes the thumbnails in a window the user is watching.
                if (isPipActive || document.pictureInPictureElement) {
                    return;
                }

                // Debounce video unsubscription to avoid rapid toggle
                debounceTimeoutRef.current = setTimeout(async () => {
                    try {
                        await unsubscribeAllVideos();
                    } catch (error) {
                        reportMeetError('Failed to unsubscribe all videos for background', error);
                    }
                    debounceTimeoutRef.current = null;
                }, DEBOUNCE_DELAY);
            } else if (document.visibilityState === 'visible') {
                // Page is in foreground, reset websocket parameters to null to use the default values
                try {
                    await meetCoreClient.setWebsocketPingInterval(null);
                    await meetCoreClient.setWebsocketPongTimeout(null);
                    await meetCoreClient.setWebsocketMaxPingFailures(null);
                } catch (error) {
                    reportMeetError('Failed to reset websocket parameters for foreground', error);
                }

                // Resume paused audio elements that were created while in background
                // Safari's autoplay policy prevents new audio elements from playing in background tabs
                const audioElements = document.querySelectorAll('audio');
                for (const audio of audioElements) {
                    if (audio.paused && audio.srcObject) {
                        try {
                            await audio.play();
                        } catch (error) {
                            // Log error but don't interrupt the flow
                            // Some audio elements may fail to play due to user interaction requirements
                            reportMeetError('Failed to resume audio playback after visibility change', error);
                        }
                    }
                }

                // Resume paused video elements that were created while in background
                // Only resume videos that are not muted to avoid unnecessary playback
                const videoElements = document.querySelectorAll('video');
                for (const video of videoElements) {
                    if (video.paused && video.srcObject && !video.muted) {
                        try {
                            await video.play();
                        } catch (error) {
                            // Log error but don't interrupt the flow
                            reportMeetError('Failed to resume video playback after visibility change', error);
                        }
                    }
                }

                // Debounce video resubscription to avoid rapid toggle
                debounceTimeoutRef.current = setTimeout(async () => {
                    try {
                        await resubscribeAllVideos();
                    } catch (error) {
                        reportMeetError('Failed to resubscribe all videos for foreground', error);
                    }
                    debounceTimeoutRef.current = null;
                }, DEBOUNCE_DELAY);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Clear any pending timeout on cleanup
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
        };
    }, [
        meetCoreClient,
        joinedRoom,
        reportMeetError,
        unsubscribeAllVideos,
        resubscribeAllVideos,
        handlesVideoSubscriptions,
        isPipActive,
    ]);
};
