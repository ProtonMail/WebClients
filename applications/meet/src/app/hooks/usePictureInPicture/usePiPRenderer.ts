import { useCallback, useRef } from 'react';

import type { Track as LiveKitTrack } from 'livekit-client';

import { meetingLogger } from '@proton/meet/utils/meetingLogger';

import { PIP_PREVIEW_ITEM_HEIGHT } from '../../constants';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { useLatest } from '../useLatest';
import { useMirrorSelfView } from '../useMirrorSelfView';
import { drawMessageOverlay, drawParticipantPlaceholder, drawVideoWithAspectRatio } from './drawingUtils';
import type { DrawablePiPTile, PiPOverlayMessage } from './types';

interface RenderedVideo {
    element: HTMLVideoElement;
    track: LiveKitTrack;
}

export function usePiPRenderer() {
    const animationFrameRef = useRef<number>(undefined);
    const renderGenerationRef = useRef(0);
    const renderedVideosRef = useRef<Map<string, RenderedVideo>>(new Map());
    const classColorsRef = useRef<Map<string, string>>(new Map());
    const mirrorSelfViewRef = useLatest(useMirrorSelfView());

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

    const cleanupRenderedVideo = useCallback(({ element, track }: RenderedVideo) => {
        try {
            track.detach(element);
            element.pause();
            element.srcObject = null;
            element.load();
            element.remove();
        } catch (error) {
            meetingLogger.error('Error cleaning up video element:', error);
        }
    }, []);

    const cleanupAllVideoElements = useCallback(() => {
        for (const renderedVideo of renderedVideosRef.current.values()) {
            cleanupRenderedVideo(renderedVideo);
        }
        renderedVideosRef.current.clear();
    }, [cleanupRenderedVideo]);

    const cleanupStaleVideoElements = useCallback(
        (activeTrackIds: Set<string>) => {
            for (const [trackId, renderedVideo] of renderedVideosRef.current.entries()) {
                if (!activeTrackIds.has(trackId)) {
                    cleanupRenderedVideo(renderedVideo);
                    renderedVideosRef.current.delete(trackId);
                }
            }
        },
        [cleanupRenderedVideo]
    );

    const createVideoElement = useCallback((track: LiveKitTrack, trackId: string) => {
        let renderedVideo = renderedVideosRef.current.get(trackId);

        if (!renderedVideo) {
            const element = document.createElement('video');
            element.muted = true;
            element.autoplay = true;
            element.playsInline = true;
            element.crossOrigin = 'anonymous';

            renderedVideo = { element, track };
            renderedVideosRef.current.set(trackId, renderedVideo);
        }

        const videoElement = renderedVideo.element;
        const hasMediaTrack = !!track.mediaStreamTrack;
        const currentStream = videoElement.srcObject as MediaStream | null;
        const isAttached = currentStream?.getTracks().includes(track.mediaStreamTrack!);

        if (hasMediaTrack && !isAttached) {
            if (currentStream) {
                renderedVideo.track.detach(videoElement);
            }

            track.attach(videoElement);
            renderedVideo.track = track;

            const playVideo = async () => {
                try {
                    await videoElement.play();
                } catch (error) {
                    meetingLogger.error('Failed to play video:', error);
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
                    const shouldMirror = isLocalParticipant && !tile.isScreenShare && mirrorSelfViewRef.current;

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
        [createVideoElement, ensureVideoPlaying, cleanupStaleVideoElements, getClassColor, mirrorSelfViewRef]
    );

    const cancelRenderLoop = useCallback(() => {
        renderGenerationRef.current += 1;

        if (animationFrameRef.current !== undefined) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
    }, []);

    const startRendering = useCallback(
        (
            canvas: HTMLCanvasElement,
            tilesToDisplay: DrawablePiPTile[],
            messages: PiPOverlayMessage[],
            participantDecryptedNameMap: Record<string, string>
        ) => {
            cancelRenderLoop();
            const generation = renderGenerationRef.current;

            const render = () => {
                if (generation !== renderGenerationRef.current) {
                    return;
                }

                drawPiP(canvas, tilesToDisplay, messages, participantDecryptedNameMap);

                animationFrameRef.current = requestAnimationFrame(render);
            };
            render();
        },
        [drawPiP, cancelRenderLoop]
    );

    const stopRendering = useCallback(() => {
        cancelRenderLoop();
        cleanupAllVideoElements();
    }, [cancelRenderLoop, cleanupAllVideoElements]);

    return {
        startRendering,
        stopRendering,
        cleanupAllVideoElements,
    };
}
