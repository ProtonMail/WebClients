import { useCallback, useRef } from 'react';

import type { Track as LiveKitTrack } from 'livekit-client';

import { PIP_PREVIEW_ITEM_HEIGHT } from '../../constants';
import { drawMessageOverlay, drawVideoWithAspectRatio } from './drawingUtils';
import type { PiPOverlayMessage, TrackInfo } from './types';

export function usePiPRenderer() {
    const animationFrameRef = useRef<number>();
    const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

    const cleanupVideoElement = useCallback((videoElement: HTMLVideoElement) => {
        try {
            videoElement.pause();
            videoElement.srcObject = null;
            videoElement.load();

            if (videoElement.parentNode) {
                videoElement.parentNode.removeChild(videoElement);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error cleaning up video element:', error);
        }
    }, []);

    const cleanupAllVideoElements = useCallback(() => {
        for (const videoElement of videoElementsRef.current.values()) {
            cleanupVideoElement(videoElement);
        }
        videoElementsRef.current.clear();
    }, [cleanupVideoElement]);

    const cleanupStaleVideoElements = useCallback(
        (activeTrackIds: Set<string>) => {
            const elementsToRemove: string[] = [];

            for (const [trackId, videoElement] of videoElementsRef.current.entries()) {
                if (!activeTrackIds.has(trackId)) {
                    cleanupVideoElement(videoElement);
                    elementsToRemove.push(trackId);
                }
            }

            elementsToRemove.forEach((trackId) => {
                videoElementsRef.current.delete(trackId);
            });
        },
        [cleanupVideoElement]
    );

    // Create and manage video elements
    const createVideoElement = useCallback((track: LiveKitTrack, trackId: string) => {
        let videoElement = videoElementsRef.current.get(trackId);

        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.muted = true;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.crossOrigin = 'anonymous';

            videoElementsRef.current.set(trackId, videoElement);
        }

        const hasMediaTrack = !!track.mediaStreamTrack;
        const currentStream = videoElement.srcObject as MediaStream | null;
        const isAttached = currentStream?.getTracks().includes(track.mediaStreamTrack!);

        if (hasMediaTrack && !isAttached) {
            if (currentStream) {
                track.detach(videoElement);
            }

            // Attach the track
            track.attach(videoElement);

            const playVideo = async () => {
                try {
                    if (videoElement) {
                        await videoElement.play();
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to play video:', error);
                }
            };

            if (videoElement.readyState >= 2) {
                void playVideo();
            } else {
                videoElement.addEventListener('canplay', playVideo, { once: true });
            }
        }

        return videoElement;
    }, []);

    // Ensure video is playing
    const ensureVideoPlaying = useCallback((videoElement: HTMLVideoElement) => {
        if (videoElement.paused) {
            videoElement.play().catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Failed to restart video:', error);
            });
        }
    }, []);

    // Draw PiP canvas
    const drawPiP = useCallback(
        (
            canvas: HTMLCanvasElement,
            tracksToDisplay: TrackInfo[],
            messages: PiPOverlayMessage[],
            participantNameMap: Record<string, string>
        ) => {
            if (!canvas) {
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }

            const activeTrackIds = new Set(
                tracksToDisplay.map((trackInfo, index) => trackInfo.track.sid || `track-${index}`)
            );
            cleanupStaleVideoElements(activeTrackIds);

            // Adjust canvas size when tracks count changes; ensure minimum height to avoid 0x0 streams
            const desiredHeight = PIP_PREVIEW_ITEM_HEIGHT * Math.max(1, Math.min(tracksToDisplay.length, 3));
            if (canvas.height !== desiredHeight) {
                canvas.height = desiredHeight;
            }

            // Clear canvas with black background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const sectionCount = Math.max(1, tracksToDisplay.length);
            const sectionHeight = canvas.height / sectionCount;

            tracksToDisplay.forEach((trackInfo, index) => {
                const trackId = trackInfo.track.sid || `track-${index}`;
                const videoElement = createVideoElement(trackInfo.track, trackId);

                // Ensure video is playing
                ensureVideoPlaying(videoElement);

                const y = index * sectionHeight;
                const videoHeight = sectionHeight;

                // Mirror the local participant's camera feed (but not screen share)
                const isLocalParticipant = trackInfo.participant?.isLocal || false;
                const shouldMirror = isLocalParticipant && !trackInfo.isScreenShare;

                // Draw each track in its own section
                drawVideoWithAspectRatio({
                    ctx,
                    videoElement,
                    x: 0,
                    y,
                    width: canvas.width,
                    height: videoHeight,
                    mirror: shouldMirror,
                });

                // Draw participant name below the video
                const nameY = y + videoHeight - 25;
                const participantName = participantNameMap[trackInfo.participant?.identity || ''] || 'Unknown';
                const displayName = trackInfo.isScreenShare ? `${participantName} (Screen Sharing)` : participantName;

                // Draw participant name with white text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                // Add text shadow for better visibility
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                ctx.fillText(displayName, canvas.width / 2, nameY);

                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            });

            // Draw message overlay on top of everything (highest z-index)
            drawMessageOverlay({ ctx, canvasWidth: canvas.width, canvasHeight: canvas.height, messages });
        },
        [createVideoElement, ensureVideoPlaying, cleanupStaleVideoElements]
    );

    // Start rendering loop
    const startRendering = useCallback(
        (
            canvas: HTMLCanvasElement,
            tracksToDisplay: TrackInfo[],
            messages: PiPOverlayMessage[],
            participantNameMap: Record<string, string>
        ) => {
            const render = () => {
                drawPiP(canvas, tracksToDisplay, messages, participantNameMap);

                animationFrameRef.current = requestAnimationFrame(render);
            };
            render();
        },
        [drawPiP]
    );

    // Stop rendering loop and clean up all resources
    const stopRendering = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }

        cleanupAllVideoElements();
    }, [cleanupAllVideoElements]);

    return {
        startRendering,
        stopRendering,
        cleanupAllVideoElements,
    };
}
