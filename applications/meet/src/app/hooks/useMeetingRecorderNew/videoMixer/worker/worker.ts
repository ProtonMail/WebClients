import { getFirstEncodableAudioCodec } from 'mediabunny';

import { EncoderPipeline } from '../../mediaEncoder/encoderPipeline';
import { createWorkerLogger } from '../../workerLogger';
import { RECORDING_FPS } from '../constants';
import { selectLayout } from '../layouts/selectLayout';
import { type SceneState, VideoMixerMessageType, type VideoMixerWorkerMessage } from '../types';
import { startTrackCaptureInWorker, stopTrackCaptureInWorker } from './trackProcessor';

const logger = createWorkerLogger('MeetingRecorder/renderWorker');

const interFont = new FontFace('Inter', 'local(Inter), local(Inter UI)');

interFont
    .load()
    .then((font) => {
        self.fonts.add(font);
    })
    .catch((err) => {
        logger.warn('Inter font failed to load, falling back to system fonts:', err);
    });

interface WorkerState {
    canvas: OffscreenCanvas | null;
    ctx: OffscreenCanvasRenderingContext2D | null;
    scene: SceneState;
    videoFrames: Map<string, VideoFrame | ImageBitmap>;
    renderInterval: ReturnType<typeof setInterval> | null;
    encoder: EncoderPipeline | null;
    trackProcessors: Map<string, { reader: ReadableStreamDefaultReader<VideoFrame>; participantIdentity: string }>;
}

const state: WorkerState = {
    canvas: null,
    ctx: null,
    scene: {
        participants: [],
        isLargerThanMd: true,
        isNarrowHeight: false,
        gridLayout: { cols: 0, rows: 0 },
    },
    videoFrames: new Map(),
    renderInterval: null,
    encoder: null,
    trackProcessors: new Map(),
};

function cleanupFrame(frame: VideoFrame | ImageBitmap) {
    if ('close' in frame) {
        frame.close();
    }
}

function render() {
    if (!state.canvas || !state.ctx) {
        return;
    }

    state.ctx.fillStyle = '#1a1a28';
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    const layout = selectLayout(state.scene);
    layout.draw({
        ctx: state.ctx,
        canvas: state.canvas,
        scene: state.scene,
        videoFrames: state.videoFrames,
    });
}

function startRenderLoop() {
    if (state.renderInterval !== null) {
        return;
    }

    render();
    state.renderInterval = setInterval(render, 1000 / RECORDING_FPS);
}

function stopRenderLoop() {
    if (state.renderInterval !== null) {
        clearInterval(state.renderInterval);
        state.renderInterval = null;
    }

    state.videoFrames.forEach(cleanupFrame);
    state.videoFrames.clear();
}

async function startEncoder() {
    if (!state.canvas || state.encoder) {
        return;
    }

    const audioCodec =
        (await getFirstEncodableAudioCodec(['aac', 'opus'], { numberOfChannels: 2, sampleRate: 48000 })) ?? 'opus';

    state.encoder = new EncoderPipeline(
        state.canvas,
        RECORDING_FPS,
        audioCodec,
        (data, position) => {
            self.postMessage({ type: 'encoderChunk', data, position }, [data.buffer]);
        },
        (error) => logger.error('audio sample add failed:', error)
    );
    await state.encoder.start();
}

async function stopEncoder() {
    try {
        await state.encoder?.stop();
    } finally {
        // Always ack, even if stop() throws — the client awaits encoderDone.
        state.encoder = null;
        self.postMessage({ type: 'encoderDone' });
    }
}

const trackProcessorEnv = {
    trackProcessors: state.trackProcessors,
    videoFrames: state.videoFrames,
    cleanupFrame,
};

self.onmessage = (event: MessageEvent<VideoMixerWorkerMessage>) => {
    const message = event.data;

    switch (message.type) {
        case VideoMixerMessageType.INIT: {
            state.canvas = message.canvas;
            state.ctx = message.canvas.getContext('2d', {
                alpha: false,
                desynchronized: true,
                willReadFrequently: false,
            });
            if (state.ctx) {
                state.ctx.fillStyle = '#1a1a28';
                state.ctx.fillRect(0, 0, message.canvas.width, message.canvas.height);
            }
            state.scene = message.state;
            break;
        }

        case VideoMixerMessageType.RENDER:
            startRenderLoop();
            break;

        case VideoMixerMessageType.UPDATE_STATE:
            state.scene = message.state;
            break;

        case VideoMixerMessageType.UPDATE_FRAME: {
            const { participantIdentity, frame } = message.frameData;
            const oldFrame = state.videoFrames.get(participantIdentity);
            if (oldFrame) {
                cleanupFrame(oldFrame);
            }
            state.videoFrames.set(participantIdentity, frame);
            break;
        }

        case VideoMixerMessageType.START_TRACK_CAPTURE:
            void startTrackCaptureInWorker(trackProcessorEnv, message.trackData);
            break;

        case VideoMixerMessageType.STOP_TRACK_CAPTURE:
            stopTrackCaptureInWorker(trackProcessorEnv, message.trackId);
            break;

        case VideoMixerMessageType.START_ENCODER:
            void startEncoder();
            break;

        case VideoMixerMessageType.STOP_ENCODER:
            void stopEncoder();
            break;

        case VideoMixerMessageType.PROVIDE_AUDIO_SAMPLES:
            state.encoder?.addAudioSamples(message.samples);
            break;

        case VideoMixerMessageType.STOP:
            state.trackProcessors.forEach((_, tid) => stopTrackCaptureInWorker(trackProcessorEnv, tid));
            stopRenderLoop();
            break;
    }
};

export {};
