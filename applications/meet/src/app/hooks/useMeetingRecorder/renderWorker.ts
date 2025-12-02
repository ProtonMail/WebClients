import { SCREEN_SHARE_PAGE_SIZE } from '../../constants';
import {
    PROFILE_COLORS,
    drawParticipantBorder,
    drawParticipantName,
    drawParticipantPlaceholder,
    roundRect,
} from './drawingUtils';
import { createMediaStreamTrackProcessor } from './utils';

const FPS = 30;
const GAP = 11;
const BORDER_RADIUS = 28;
const SIDEBAR_WIDTH = 320;

const interFont = new FontFace('Inter', 'local(Inter), local(Inter UI)');

interFont
    .load()
    .then((font) => {
        // @ts-expect-error - fonts is available in Worker context
        self.fonts.add(font);
    })
    .catch(() => {
        // Fallback to system fonts if Inter fails to load
    });

interface VideoFrameData {
    participantIdentity: string;
    bitmap: ImageBitmap;
}

interface SingleFrameData {
    participantIdentity: string;
    frame: VideoFrame | ImageBitmap;
}

interface TrackCaptureData {
    participantIdentity: string;
    track: MediaStreamTrack;
    trackId: string;
}

interface RenderWorkerMessage {
    type:
        | 'init'
        | 'render'
        | 'updateState'
        | 'updateFrames'
        | 'updateFrame'
        | 'stop'
        | 'startTrackCapture'
        | 'stopTrackCapture';
    canvas?: OffscreenCanvas;
    state?: RenderState;
    frames?: VideoFrameData[];
    frameData?: SingleFrameData;
    trackData?: TrackCaptureData;
    trackId?: string;
}

interface ParticipantInfo {
    identity: string;
    name: string;
    participantIndex: number;
    isScreenShare: boolean;
    hasVideo: boolean;
    hasActiveAudio: boolean;
}

interface RenderState {
    participants: ParticipantInfo[];
    gridLayout: { cols: number; rows: number };
}

interface WorkerState {
    canvas: OffscreenCanvas | null;
    ctx: OffscreenCanvasRenderingContext2D | null;
    renderState: RenderState;
    videoFrames: Map<string, VideoFrame | ImageBitmap>;
    renderInterval: number | null;
    trackProcessors: Map<string, { reader: ReadableStreamDefaultReader<VideoFrame>; participantIdentity: string }>;
}

const state: WorkerState = {
    canvas: null,
    ctx: null,
    renderState: {
        participants: [],
        gridLayout: { cols: 0, rows: 0 },
    },
    videoFrames: new Map(),
    renderInterval: null,
    trackProcessors: new Map(),
};

interface DrawVideoFrameParams {
    ctx: OffscreenCanvasRenderingContext2D;
    frame: VideoFrame | ImageBitmap;
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number;
    objectFit?: 'cover' | 'contain';
}

function drawVideoFrame({ ctx, frame, x, y, width, height, radius = 0, objectFit = 'cover' }: DrawVideoFrameParams) {
    try {
        const videoWidth = 'displayWidth' in frame ? frame.displayWidth : frame.width;
        const videoHeight = 'displayHeight' in frame ? frame.displayHeight : frame.height;

        if (videoWidth === 0 || videoHeight === 0) {
            return;
        }

        const videoAspect = videoWidth / videoHeight;
        const targetAspect = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;

        if (objectFit === 'cover') {
            if (videoAspect > targetAspect) {
                drawHeight = height;
                drawWidth = height * videoAspect;
                drawX = x - (drawWidth - width) / 2;
                drawY = y;
            } else {
                drawWidth = width;
                drawHeight = width / videoAspect;
                drawX = x;
                drawY = y - (drawHeight - height) / 2;
            }
        } else {
            if (videoAspect > targetAspect) {
                drawWidth = width;
                drawHeight = width / videoAspect;
                drawX = x;
                drawY = y + (height - drawHeight) / 2;
            } else {
                drawHeight = height;
                drawWidth = height * videoAspect;
                drawX = x + (width - drawWidth) / 2;
                drawY = y;
            }
        }

        ctx.save();

        if (radius > 0) {
            const maxRadius = Math.min(radius, Math.min(width, height) / 2);
            roundRect(ctx, x, y, width, height, maxRadius);
        } else {
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.closePath();
        }

        ctx.clip();

        ctx.drawImage(frame, drawX, drawY, drawWidth, drawHeight);

        ctx.restore();
    } catch (error) {}
}

function drawRecordingCanvas(canvas: OffscreenCanvas, ctx: OffscreenCanvasRenderingContext2D) {
    ctx.fillStyle = '#1a1a28';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { participants, gridLayout } = state.renderState;

    const screenShareParticipant = participants.find((p) => p.isScreenShare);
    const regularParticipants = participants.filter((p) => !p.isScreenShare);

    const { cols, rows } = gridLayout;

    if (screenShareParticipant && regularParticipants.length > 0) {
        const sidebarItemHeight = canvas.height / SCREEN_SHARE_PAGE_SIZE;

        const screenShareX = GAP;
        const screenShareY = GAP;
        const screenShareWidth = canvas.width - SIDEBAR_WIDTH - GAP * 2;
        const screenShareHeight = canvas.height - GAP * 2;

        const screenShareKey = `${screenShareParticipant.identity}-screenshare`;
        const screenShareBitmap = state.videoFrames.get(screenShareKey);
        if (screenShareBitmap) {
            drawVideoFrame({
                ctx,
                frame: screenShareBitmap,
                x: screenShareX,
                y: screenShareY,
                width: screenShareWidth,
                height: screenShareHeight,
                objectFit: 'contain',
            });
        }

        drawParticipantName({
            ctx,
            name: `${screenShareParticipant.name} (is presenting)`,
            x: screenShareX,
            y: screenShareY,
            height: screenShareHeight,
        });

        const sidebarX = screenShareX + screenShareWidth + GAP;

        regularParticipants.slice(0, SCREEN_SHARE_PAGE_SIZE).forEach((participant, index) => {
            const xPos = sidebarX;
            const yPos = GAP + index * (sidebarItemHeight + GAP);
            const tileWidth = SIDEBAR_WIDTH - 2 * GAP;
            const tileHeight = sidebarItemHeight;

            const colorIndex = participant.participantIndex % PROFILE_COLORS.length;

            if (participant.hasVideo) {
                const bitmap = state.videoFrames.get(participant.identity);
                if (bitmap) {
                    drawVideoFrame({
                        ctx,
                        frame: bitmap,
                        x: xPos,
                        y: yPos,
                        width: tileWidth,
                        height: tileHeight,
                        radius: BORDER_RADIUS / 2,
                    });
                }
            } else {
                drawParticipantPlaceholder({
                    ctx,
                    name: participant.name,
                    x: xPos,
                    y: yPos,
                    width: tileWidth,
                    height: tileHeight,
                    colorIndex,
                    radius: BORDER_RADIUS / 2,
                });
            }

            drawParticipantBorder({
                ctx,
                x: xPos,
                y: yPos,
                width: tileWidth,
                height: tileHeight,
                colorIndex,
                isActive: participant.hasActiveAudio,
                radius: BORDER_RADIUS / 2,
            });

            drawParticipantName({
                ctx,
                name: participant.name,
                x: xPos,
                y: yPos,
                height: tileHeight,
            });
        });
    } else if (screenShareParticipant) {
        const screenShareKey = `${screenShareParticipant.identity}-screenshare`;
        const screenShareBitmap = state.videoFrames.get(screenShareKey);
        if (screenShareBitmap) {
            drawVideoFrame({
                ctx,
                frame: screenShareBitmap,
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height,
                objectFit: 'contain',
            });
        }

        drawParticipantName({
            ctx,
            name: `${screenShareParticipant.name} (is presenting)`,
            x: 0,
            y: 0,
            height: canvas.height,
        });
    } else {
        const cellWidth = (canvas.width - GAP * 2) / cols;
        const cellHeight = (canvas.height - GAP * 2) / rows;

        regularParticipants.forEach((participant, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            const x = col * cellWidth + GAP;
            const y = row * cellHeight + GAP;
            const tileWidth = cellWidth - GAP;
            const tileHeight = cellHeight - GAP;

            const colorIndex = participant.participantIndex % PROFILE_COLORS.length;

            if (participant.hasVideo) {
                const bitmap = state.videoFrames.get(participant.identity);
                if (bitmap) {
                    drawVideoFrame({
                        ctx,
                        frame: bitmap,
                        x,
                        y,
                        width: tileWidth,
                        height: tileHeight,
                        radius: BORDER_RADIUS,
                    });
                }
            } else {
                drawParticipantPlaceholder({
                    ctx,
                    name: participant.name,
                    x,
                    y,
                    width: tileWidth,
                    height: tileHeight,
                    colorIndex,
                    radius: BORDER_RADIUS,
                });
            }

            drawParticipantBorder({
                ctx,
                x,
                y,
                width: tileWidth,
                height: tileHeight,
                colorIndex,
                isActive: participant.hasActiveAudio,
                radius: BORDER_RADIUS,
            });

            drawParticipantName({
                ctx,
                name: participant.name,
                x,
                y,
                height: tileHeight,
            });
        });
    }
}

function startRenderLoop() {
    if (state.renderInterval !== null) {
        return;
    }

    const render = () => {
        if (state.canvas && state.ctx) {
            drawRecordingCanvas(state.canvas, state.ctx);
        }
    };

    render();
    state.renderInterval = setInterval(render, 1000 / FPS) as unknown as number;
}

function stopRenderLoop() {
    if (state.renderInterval !== null) {
        clearInterval(state.renderInterval);
        state.renderInterval = null;
    }

    state.videoFrames.forEach((frame) => {
        if ('close' in frame) {
            frame.close();
        }
    });
    state.videoFrames.clear();
}

function cleanupFrame(frame: VideoFrame | ImageBitmap) {
    if ('close' in frame) {
        frame.close();
    }
}

async function startTrackCaptureInWorker(trackData: TrackCaptureData) {
    const { participantIdentity, track, trackId } = trackData;

    const processor = createMediaStreamTrackProcessor(track);
    if (!processor) {
        return;
    }
    const reader = processor.readable.getReader();

    state.trackProcessors.set(trackId, { reader, participantIdentity });

    const pump = async () => {
        try {
            while (state.trackProcessors.has(trackId)) {
                const { value: frame, done } = await reader.read();
                if (done) {
                    break;
                }

                if (frame) {
                    try {
                        // Convert to ImageBitmap for rendering
                        const bitmap = await createImageBitmap(frame);
                        frame.close();

                        const oldFrame = state.videoFrames.get(participantIdentity);
                        if (oldFrame) {
                            cleanupFrame(oldFrame);
                        }
                        state.videoFrames.set(participantIdentity, bitmap);
                    } catch (err) {
                        frame.close();
                    }
                }
            }
        } catch (error) {
            // Reader was cancelled or track ended
        }
    };

    void pump();
}

function stopTrackCaptureInWorker(trackId: string) {
    const processor = state.trackProcessors.get(trackId);
    if (processor?.reader) {
        void processor.reader.cancel();
    }
    state.trackProcessors.delete(trackId);
}

self.onmessage = (event: MessageEvent<RenderWorkerMessage>) => {
    const { type, canvas, state: newState, frames, frameData, trackData, trackId } = event.data;

    switch (type) {
        case 'init':
            if (canvas) {
                state.canvas = canvas;
                state.ctx = canvas.getContext('2d', {
                    alpha: false,
                    desynchronized: true,
                });
                if (state.ctx) {
                    state.ctx.fillStyle = '#1a1a28';
                    state.ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
            if (newState) {
                state.renderState = newState;
            }
            break;

        case 'render':
            startRenderLoop();
            break;

        case 'updateState':
            if (newState) {
                state.renderState = newState;
            }
            break;

        case 'updateFrame':
            if (frameData) {
                const { participantIdentity, frame } = frameData;
                const oldFrame = state.videoFrames.get(participantIdentity);
                if (oldFrame) {
                    cleanupFrame(oldFrame);
                }
                state.videoFrames.set(participantIdentity, frame);
            }
            break;

        case 'updateFrames':
            if (frames) {
                frames.forEach(({ participantIdentity, bitmap }) => {
                    const oldBitmap = state.videoFrames.get(participantIdentity);
                    if (oldBitmap) {
                        cleanupFrame(oldBitmap);
                    }
                    state.videoFrames.set(participantIdentity, bitmap);
                });
            }
            break;

        case 'startTrackCapture':
            if (trackData) {
                void startTrackCaptureInWorker(trackData);
            }
            break;

        case 'stopTrackCapture':
            if (trackId) {
                stopTrackCaptureInWorker(trackId);
            }
            break;

        case 'stop':
            // Stop all track processors
            state.trackProcessors.forEach((_, tid) => stopTrackCaptureInWorker(tid));
            stopRenderLoop();
            break;
    }
};

export {};
