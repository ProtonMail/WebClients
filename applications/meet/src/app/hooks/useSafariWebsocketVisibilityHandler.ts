import { useEffect, useRef } from 'react';

import type { App } from '@proton-meet/proton-meet-core';

import { useMeetErrorReporting } from '@proton/meet';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { useCameraTrackSubscriptionManager } from '../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';

interface UseSafariWebsocketVisibilityHandlerParams {
    wasmApp: App | null;
    joinedRoom: boolean;
}

/**
 * Hook to handle Safari websocket ping/pong settings, media playback, and video subscriptions when page visibility changes.
 * When Safari is in background:
 *   - Sets websocket parameters to 60 seconds to prevent disconnection
 *   - Unsubscribes all video tracks to save bandwidth and resources (with debounce)
 * When Safari returns to foreground:
 *   - Resets websocket parameters to null (default)
 *   - Resumes paused audio and video elements that were created while in background
 *   - Resubscribes all video tracks (with debounce)
 */
export const useSafariWebsocketVisibilityHandler = ({
    wasmApp,
    joinedRoom,
}: UseSafariWebsocketVisibilityHandlerParams) => {
    const reportMeetError = useMeetErrorReporting();
    const { unsubscribeAllVideos, resubscribeAllVideos } = useCameraTrackSubscriptionManager();
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const DEBOUNCE_DELAY = 500; // 500ms debounce to avoid rapid toggle

    useEffect(() => {
        if (!wasmApp || !joinedRoom || !isSafari()) {
            return;
        }

        const handleVisibilityChange = async () => {
            if (!wasmApp) {
                return;
            }

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
                    await wasmApp.setWebsocketPingInterval(60n);
                    await wasmApp.setWebsocketPongTimeout(60n);
                    await wasmApp.setWebsocketMaxPingFailures(3);
                } catch (error) {
                    reportMeetError('Failed to set websocket parameters for background', error);
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
                    await wasmApp.setWebsocketPingInterval(null);
                    await wasmApp.setWebsocketPongTimeout(null);
                    await wasmApp.setWebsocketMaxPingFailures(null);
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
    }, [wasmApp, joinedRoom, reportMeetError, unsubscribeAllVideos, resubscribeAllVideos]);
};
