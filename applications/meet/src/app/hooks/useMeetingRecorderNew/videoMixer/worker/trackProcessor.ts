import { createMediaStreamTrackProcessor } from '../../utils/trackProcessorSupport';
import { createWorkerLogger } from '../../workerLogger';
import { RECORDING_FPS } from '../constants';
import type { TrackCaptureData } from '../types';

const logger = createWorkerLogger('MeetingRecorder/renderWorker');

interface TrackProcessor {
    reader: ReadableStreamDefaultReader<VideoFrame>;
    participantIdentity: string;
}

interface TrackProcessorEnv {
    trackProcessors: Map<string, TrackProcessor>;
    videoFrames: Map<string, VideoFrame | ImageBitmap>;
    cleanupFrame: (frame: VideoFrame | ImageBitmap) => void;
}

// Safari path: the worker owns the MediaStreamTrackProcessor and pumps
// VideoFrames into the shared `videoFrames` map. The render loop will pick
// them up on its next tick.
export async function startTrackCaptureInWorker(env: TrackProcessorEnv, trackData: TrackCaptureData) {
    const { participantIdentity, track, trackId } = trackData;

    const processor = createMediaStreamTrackProcessor(track);
    if (!processor) {
        return;
    }
    const reader = processor.readable.getReader();

    env.trackProcessors.set(trackId, { reader, participantIdentity });

    const minFrameInterval = 1000 / RECORDING_FPS;
    let lastProcessedTime = 0;

    const pump = async () => {
        try {
            while (env.trackProcessors.has(trackId)) {
                const { value: frame, done } = await reader.read();
                if (done) {
                    break;
                }

                if (!frame) {
                    continue;
                }

                const now = performance.now();
                if (now - lastProcessedTime < minFrameInterval) {
                    frame.close();
                    continue;
                }

                try {
                    const bitmap = await createImageBitmap(frame);
                    frame.close();

                    const oldFrame = env.videoFrames.get(participantIdentity);
                    if (oldFrame) {
                        env.cleanupFrame(oldFrame);
                    }
                    env.videoFrames.set(participantIdentity, bitmap);
                    lastProcessedTime = now;
                } catch (err) {
                    frame.close();
                    logger.warn(`createImageBitmap failed for track ${trackId}:`, err);
                }
            }
        } catch (error) {
            logger.debug(`track processor pump ended for ${trackId}:`, error);
        }
    };

    void pump();
}

export function stopTrackCaptureInWorker(env: TrackProcessorEnv, trackId: string) {
    const processor = env.trackProcessors.get(trackId);
    if (processor?.reader) {
        void processor.reader.cancel();
    }
    env.trackProcessors.delete(trackId);
}
