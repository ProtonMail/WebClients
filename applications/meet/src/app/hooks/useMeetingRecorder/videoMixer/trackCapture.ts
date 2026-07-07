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

export const startTrackCaptureWithProcessor = ({
    worker,
    mediaTrack,
    trackId,
    participantKey,
}: {
    worker: Worker;
    mediaTrack: MediaStreamTrack;
    trackId: string;
    participantKey: string;
}): TrackCapture | null => {
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
        } catch {}
    };

    void pump();

    return {
        trackId,
        stop: () => {
            stopped = true;
            void reader.cancel();
        },
    };
};

const startMainThreadVideoCapture = ({
    worker,
    mediaTrack,
    participantKey,
    trackId,
}: {
    worker: Worker;
    mediaTrack: MediaStreamTrack;
    participantKey: string;
    trackId: string;
}): TrackCapture => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = new MediaStream([mediaTrack]);
    video.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(video);
    void video.play();

    const minFrameInterval = 1000 / RECORDING_FPS;
    let lastProcessedTime = 0;
    let stopped = false;
    let rvfcHandle = 0;

    const onPresentedFrame = async () => {
        const now = performance.now();
        if (now - lastProcessedTime >= minFrameInterval) {
            lastProcessedTime = now;
            const bitmap = await createImageBitmap(video);
            worker.postMessage(
                {
                    type: VideoMixerMessageType.UPDATE_FRAME,
                    frameData: { participantIdentity: participantKey, frame: bitmap },
                },
                [bitmap]
            );
        }
        if (!stopped) {
            rvfcHandle = video.requestVideoFrameCallback(onPresentedFrame);
        }
    };
    rvfcHandle = video.requestVideoFrameCallback(onPresentedFrame);

    return {
        trackId,
        stop: () => {
            stopped = true;
            video.cancelVideoFrameCallback(rvfcHandle);
            video.pause();
            video.srcObject = null;
            video.remove();
        },
    };
};

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
        // Using MediaStreamTrackProcessor on the main thread. We pump frames
        // here, convert them to ImageBitmaps and ship them to the worker via
        // `UPDATE_FRAME`.
        // (Chrome / Chromium browsers)
        return startTrackCaptureWithProcessor({ worker, mediaTrack, trackId, participantKey });
    }

    try {
        // Otherwise we try to hand the raw track to the worker
        // and let it run the processor inside
        // (Safari)
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
    } catch {
        // if the track can't be serialized across postMessage, we fall back to main-thread <video> capture.
        // (Safari 17.x)
        return startMainThreadVideoCapture({ worker, mediaTrack, participantKey, trackId });
    }
};
