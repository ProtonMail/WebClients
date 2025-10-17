import { useCallback, useRef } from 'react';

import type { Track as LiveKitTrack } from '@proton-meet/livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { PIP_PREVIEW_ITEM_HEIGHT } from '../../constants';
import { drawMessageOverlay, drawVideoWithAspectRatio } from './drawingUtils';
import type { PiPOverlayMessage, TrackInfo } from './types';

export function usePiPRenderer() {
    const animationFrameRef = useRef<number>();
    const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

    // Create and manage video elements
    const createVideoElement = useCallback((track: LiveKitTrack, trackId: string) => {
        let videoElement = videoElementsRef.current.get(trackId);

        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.muted = true;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.crossOrigin = 'anonymous';

            // Use track.attach() method instead of directly accessing mediaStreamTrack
            track.attach(videoElement);

            // ensure video starts playing and stays playing
            const playVideo = async () => {
                try {
                    if (videoElement) {
                        await videoElement.play();
                    }
                } catch (error) {
                    console.error('Failed to play video:', error);
                }
            };

            videoElement.addEventListener('canplay', playVideo, { once: true });

            videoElementsRef.current.set(trackId, videoElement);
        }

        return videoElement;
    }, []);

    // Ensure video is playing
    const ensureVideoPlaying = useCallback((videoElement: HTMLVideoElement) => {
        if (videoElement.paused) {
            videoElement.play().catch((error) => {
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

                // Draw each track in its own section
                drawVideoWithAspectRatio({ ctx, videoElement, x: 0, y, width: canvas.width, height: videoHeight });

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
        [createVideoElement, ensureVideoPlaying]
    );

    // Start rendering loop
    const startRendering = useCallback(
        (
            canvas: HTMLCanvasElement,
            tracksToDisplay: TrackInfo[],
            messages: PiPOverlayMessage[],
            participantNameMap: Record<string, string>,
            throttle: boolean = false // New parameter
        ) => {
            let frameCount = 0;
            const frameSkip = throttle && isSafari() ? 5 : 0; // Skip 5 frames between renders on Safari when throttled

            const render = () => {
                frameCount++;

                // Only render every Nth frame when throttled
                if (frameSkip === 0 || frameCount % (frameSkip + 1) === 0) {
                    drawPiP(canvas, tracksToDisplay, messages, participantNameMap);
                }

                animationFrameRef.current = requestAnimationFrame(render);
            };
            render();
        },
        [drawPiP]
    );

    // Stop rendering loop
    const stopRendering = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
    }, []);

    return {
        startRendering,
        stopRendering,
    };
}
