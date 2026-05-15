import { createMediaStreamTrackProcessor, supportsTrackProcessor } from '../utils/trackProcessorSupport';
import { RECORDING_FPS } from './constants';
import { screenShareKeyFor } from './layouts/types';
import { type RecordingTrackInfo, VideoMixerMessageType } from './types';

export interface TrackCapture {
    trackId: string;
    stop: () => void;
}

export const participantKeyFor = (trackInfo: RecordingTrackInfo): string => {
    const identity = trackInfo.participant?.identity || '';
    return trackInfo.isScreenShare ? screenShareKeyFor(identity) : identity;
};

// Chrome supports MediaStreamTrackProcessor on the main thread. We pump frames
// here, convert them to ImageBitmaps and ship them to the worker via
// `UPDATE_FRAME`. Safari has no main-thread support; we hand the raw track to
// the worker which runs the processor inside.
export const startTrackCapture = ({
    worker,
    trackInfo,
}: {
    worker: Worker;
    trackInfo: RecordingTrackInfo;
}): TrackCapture | null => {
    const mediaTrack = trackInfo.track?.mediaStreamTrack;
    if (!mediaTrack) {
        return null;
    }

    const trackId = trackInfo.track?.sid || `track-${Date.now()}`;
    const participantKey = participantKeyFor(trackInfo);

    if (supportsTrackProcessor()) {
        const processor = createMediaStreamTrackProcessor(mediaTrack);
        if (!processor) {
            return null;
        }

        const reader = processor.readable.getReader();
        const minFrameInterval = 1000 / RECORDING_FPS;
        let lastProcessedTime = 0;
        let stopped = false;

        const pump = async () => {
            try {
                while (!stopped) {
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

                        worker.postMessage(
                            {
                                type: VideoMixerMessageType.UPDATE_FRAME,
                                frameData: { participantIdentity: participantKey, frame: bitmap },
                            },
                            [bitmap]
                        );
                        lastProcessedTime = now;
                    } catch {
                        frame.close();
                    }
                }
            } catch {
                // Reader cancelled or track ended — expected during cleanup.
            }
        };

        void pump();

        return {
            trackId,
            stop: () => {
                stopped = true;
                void reader.cancel();
            },
        };
    }

    worker.postMessage({
        type: VideoMixerMessageType.START_TRACK_CAPTURE,
        trackData: {
            participantIdentity: participantKey,
            track: mediaTrack,
            trackId,
        },
    });

    return {
        trackId,
        stop: () => {
            worker.postMessage({ type: VideoMixerMessageType.STOP_TRACK_CAPTURE, trackId });
        },
    };
};
