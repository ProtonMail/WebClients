import { useCallback, useRef } from 'react';

import { logger } from '@protontech/logger';
import type { Track as LiveKitTrack } from 'livekit-client';

import { PIP_PREVIEW_ITEM_HEIGHT } from '../../constants';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { drawMessageOverlay, drawParticipantPlaceholder, drawVideoWithAspectRatio } from './drawingUtils';
import type { DrawablePiPTile, PiPOverlayMessage } from './types';

export function usePiPRenderer() {
    const animationFrameRef = useRef<number>(undefined);
    const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
    const classColorsRef = useRef<Map<string, string>>(new Map());

    const getClassColor = useCallback((className: string, property: 'backgroundColor' | 'color') => {
        const cacheKey = `${className}:${property}`;
        const cachedColor = classColorsRef.current.get(cacheKey);
        if (cachedColor) {
            return cachedColor;
        }

        const probe = document.createElement('div');
        probe.className = className;
        probe.hidden = true;
        document.body.appendChild(probe);
        const color = getComputedStyle(probe)[property];
        probe.remove();

        classColorsRef.current.set(cacheKey, color);
        return color;
    }, []);

    const cleanupVideoElement = useCallback((videoElement: HTMLVideoElement) => {
        try {
            videoElement.pause();
            videoElement.srcObject = null;
            videoElement.load();

            if (videoElement.parentNode) {
                videoElement.parentNode.removeChild(videoElement);
            }
        } catch (error) {
            logger.error('Error cleaning up video element:', error);
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
                    logger.error('Failed to play video:', error);
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
            tilesToDisplay: DrawablePiPTile[],
            messages: PiPOverlayMessage[],
            participantDecryptedNameMap: Record<string, string>
        ) => {
            if (!canvas) {
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }

            const getTrackId = (track: LiveKitTrack, index: number) => track.sid || `track-${index}`;

            const activeTrackIds = new Set(
                tilesToDisplay.flatMap((tile, index) => (tile.kind === 'track' ? [getTrackId(tile.track, index)] : []))
            );
            cleanupStaleVideoElements(activeTrackIds);

            // Adjust canvas size when tracks count changes; ensure minimum height to avoid 0x0 streams
            const desiredHeight = PIP_PREVIEW_ITEM_HEIGHT * Math.max(1, Math.min(tilesToDisplay.length, 3));
            if (canvas.height !== desiredHeight) {
                canvas.height = desiredHeight;
            }

            // Clear canvas with black background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const sectionCount = Math.max(1, tilesToDisplay.length);
            const sectionHeight = canvas.height / sectionCount;

            tilesToDisplay.forEach((tile, index) => {
                const y = index * sectionHeight;
                const videoHeight = sectionHeight;
                const participantName = participantDecryptedNameMap[tile.participant?.identity || ''] || 'Unknown';

                if (tile.kind === 'placeholder') {
                    drawParticipantPlaceholder({
                        ctx,
                        x: 0,
                        y,
                        width: canvas.width,
                        height: videoHeight,
                        backgroundColor: getClassColor(tile.backgroundColorClassName, 'backgroundColor'),
                        profileColor: getClassColor(tile.profileColorClassName, 'backgroundColor'),
                        initialsColor: getClassColor('color-invert', 'color'),
                        initials: getParticipantInitials(participantDecryptedNameMap[tile.participant.identity]),
                    });
                } else {
                    const videoElement = createVideoElement(tile.track, getTrackId(tile.track, index));

                    // Ensure video is playing
                    ensureVideoPlaying(videoElement);

                    // Mirror the local participant's camera feed (but not screen share)
                    const isLocalParticipant = tile.participant?.isLocal || false;
                    const shouldMirror = isLocalParticipant && !tile.isScreenShare;

                    // The subscription manager disables remote camera publications when incoming video is turned off,
                    // so no frames will ever arrive for them
                    const isIncomingVideoDisabled = !isLocalParticipant && tile.publication?.isEnabled === false;

                    // Draw each track in its own section
                    drawVideoWithAspectRatio({
                        ctx,
                        videoElement,
                        x: 0,
                        y,
                        width: canvas.width,
                        height: videoHeight,
                        mirror: shouldMirror,
                        isIncomingVideoDisabled,
                        // Match ParticipantTile: crop landscape cameras, letterbox portrait cameras and screen shares
                        fit:
                            tile.isScreenShare || videoElement.videoWidth < videoElement.videoHeight
                                ? 'contain'
                                : 'cover',
                    });
                }

                // Draw participant name below the video
                const nameY = y + videoHeight - 25;
                const displayName =
                    tile.kind === 'track' && tile.isScreenShare
                        ? `${participantName} (Screen Sharing)`
                        : participantName;

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
        [createVideoElement, ensureVideoPlaying, cleanupStaleVideoElements, getClassColor]
    );

    // Start rendering loop
    const startRendering = useCallback(
        (
            canvas: HTMLCanvasElement,
            tilesToDisplay: DrawablePiPTile[],
            messages: PiPOverlayMessage[],
            participantDecryptedNameMap: Record<string, string>
        ) => {
            const render = () => {
                drawPiP(canvas, tilesToDisplay, messages, participantDecryptedNameMap);

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
