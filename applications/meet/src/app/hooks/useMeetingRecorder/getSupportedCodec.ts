import { isSafari } from '@proton/shared/lib/helpers/browser';

import type { CodecProbeOutcome, RecordingCodec } from './types';

const FALLBACK_MP4_CODEC: RecordingCodec = { mimeType: 'video/mp4', extension: 'mp4' };
const mp4Codecs: RecordingCodec[] = [
    {
        mimeType: 'video/mp4;codecs=avc1.640028,mp4a.40.2',
        extension: 'mp4',
    },
    {
        mimeType: 'video/mp4;codecs=avc1.4D001E,mp4a.40.2',
        extension: 'mp4',
    },
    {
        mimeType: 'video/mp4;codecs=h264,aac',
        extension: 'mp4',
    },
    {
        mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        extension: 'mp4',
    },
    {
        mimeType: 'video/mp4;codecs=avc1',
        extension: 'mp4',
    },
    FALLBACK_MP4_CODEC,
];

const FALLBACK_WEBM_CODEC: RecordingCodec = { mimeType: 'video/webm', extension: 'webm' };
const webmCodecs: RecordingCodec[] = [
    {
        mimeType: 'video/webm;codecs=vp9,opus',
        extension: 'webm',
    },
    {
        mimeType: 'video/webm;codecs=vp8,opus',
        extension: 'webm',
    },
    {
        mimeType: 'video/webm;codecs=vp9',
        extension: 'webm',
    },
    FALLBACK_WEBM_CODEC,
];

// `isTypeSupported` lies for some codecs: it returns true but the recorder
// then emits zero-byte chunks. We verify by actually running the encoder on a
// short canvas stream and checking that real bytes come out.
const isCodecSupported = (codec: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const start = performance.now();
        let settled = false;

        const finish = (supported: boolean, outcome: CodecProbeOutcome, extra?: unknown) => {
            if (settled) {
                return;
            }
            settled = true;

            const elapsedMs = Math.round(performance.now() - start);
            // eslint-disable-next-line no-console
            console.log(
                `[MeetingRecorder/codec-probe] ${codec} -> ${supported ? 'OK' : 'NO'} (${outcome}, ${elapsedMs}ms)`,
                extra ?? ''
            );

            resolve(supported);
        };

        // Quick rejection for codecs the browser openly says it doesn't support.
        if (!MediaRecorder.isTypeSupported(codec)) {
            finish(false, 'unsupported');
            return;
        }

        // Set up a probe canvas. 320x240 is the smallest size hardware H.264
        // encoders are reliably tuned for; tinier canvases stall the encoder.
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream(30);

        let timeout: ReturnType<typeof setTimeout> | undefined;
        let flushTimeout: ReturnType<typeof setTimeout> | undefined;
        let drawInterval: ReturnType<typeof setInterval> | undefined;

        const cleanup = () => {
            if (timeout !== undefined) {
                clearTimeout(timeout);
                timeout = undefined;
            }
            if (flushTimeout !== undefined) {
                clearTimeout(flushTimeout);
                flushTimeout = undefined;
            }
            if (drawInterval !== undefined) {
                clearInterval(drawInterval);
                drawInterval = undefined;
            }
            stream.getTracks().forEach((track) => track.stop());
        };

        // Real motion every frame, otherwise captureStream skips frames and
        // the encoder never primes.
        if (ctx) {
            let tick = 0;
            const draw = () => {
                tick++;
                ctx.fillStyle = `hsl(${tick % 360}, 70%, 50%)`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect((tick * 4) % canvas.width, (tick * 2) % canvas.height, 60, 60);
            };
            draw();
            drawInterval = setInterval(draw, 33);
        }

        try {
            // Build the recorder under test.
            const mediaRecorder = new MediaRecorder(stream, { mimeType: codec });

            // Any error during construction or run = codec is unusable.
            mediaRecorder.onerror = (event) => {
                cleanup();
                finish(false, 'error', (event as ErrorEvent).error ?? event);
            };

            // First non-empty chunk = success. Either it arrived while still
            // recording (`data`), or as part of the post-stop flush (`flush`).
            mediaRecorder.ondataavailable = (event) => {
                if (!event.data || event.data.size === 0) {
                    return;
                }

                if (mediaRecorder.state === 'recording') {
                    try {
                        mediaRecorder.stop();
                    } catch {
                        // ignore
                    }
                    cleanup();
                    finish(true, 'data');
                } else {
                    finish(true, 'flush');
                    cleanup();
                }
            };

            // Chrome's MP4/H.264 path ignores `start()`'s timeslice and only
            // emits at GOP boundaries (often >1s). Rather than wait for it,
            // we record briefly then force a flush via stop().
            const ENCODE_WINDOW_MS = 300;
            const FLUSH_TIMEOUT_MS = 2000;

            timeout = setTimeout(() => {
                // Force the encoder to flush whatever it's been buffering.
                try {
                    mediaRecorder.stop();
                } catch {
                    cleanup();
                    finish(false, 'timeout');
                    return;
                }

                // If even the flush produces nothing in time, give up on this codec.
                flushTimeout = setTimeout(() => {
                    cleanup();
                    finish(false, 'timeout');
                }, FLUSH_TIMEOUT_MS);
            }, ENCODE_WINDOW_MS);

            // Kick off the probe.
            mediaRecorder.start(100);
        } catch (error: any) {
            cleanup();
            finish(false, 'throw', error);
        }
    });
};

// Fallback codec, only used on the edge case of `isCodecSupported` returning a false positive
export const getFallbackCodec = (): RecordingCodec => {
    return isSafari() ? FALLBACK_MP4_CODEC : FALLBACK_WEBM_CODEC;
};

export const getSupportedRecordingCodec = async (): Promise<RecordingCodec> => {
    let selectedRecordingCodec: RecordingCodec = getFallbackCodec();
    let codecFound = false;

    // For any browser but Safari we try WebM first, then MP4
    for (const codec of [...(!isSafari() ? webmCodecs : []), ...mp4Codecs]) {
        if (await isCodecSupported(codec.mimeType)) {
            selectedRecordingCodec = codec;
            codecFound = true;
            break;
        }
    }

    if (!codecFound) {
        // eslint-disable-next-line no-console
        console.error(
            `[MeetingRecorder/codec-probe] No codec passed runtime probe; falling back to '${selectedRecordingCodec.mimeType}' anyway`
        );
    }

    // eslint-disable-next-line no-console
    console.log('[MeetingRecorder/codec-probe] selected:', selectedRecordingCodec);

    return selectedRecordingCodec;
};
