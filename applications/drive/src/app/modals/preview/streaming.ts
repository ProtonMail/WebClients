import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ProtonDriveClient, SeekableReadableStream } from '@proton/drive';
import { EnrichedError, errorToString, sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { logging } from '@proton/drive/modules/logging';
import { canHtmlVideoPlay } from '@proton/drive/modules/thumbnails';
import metrics from '@proton/metrics/index';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { initDownloadSW } from '../../modules/fileSaver/download';
import type { MseStreamHandle } from './mseStreaming';
import { isFragmentedMp4, startMseStream } from './mseStreaming';

const logger = logging.getLogger('preview-streaming');

type UseVideoStreamingProps = {
    drive: Pick<ProtonDriveClient, 'getFileDownloader'>;
    nodeUid: string;
    mimeType?: string;
    mediaDuration?: number;
};

const SW_READY_TIMEOUT = 15 * 1000; // 15 seconds for SW to register

// Enough to cover the init segment (ftyp + moov) and the first fragments, so we
// can detect a fragmented file and sniff its codecs before choosing a path.
const MSE_HEAD_BYTES = 256 * 1024;

type StreamingMode = 'detecting' | 'sw' | 'mse';

class ServiceWorkerTimeoutError extends Error {}

/**
 * Streams a video for preview, picking a playback path per file:
 *
 * - **Service Worker** (default): a range server the `<video>` element pulls
 *   byte ranges from on demand. Works for progressive MP4 and most formats.
 * - **MSE** (fragmented MP4 only): fragments are fed straight into a
 *   `SourceBuffer` (see `mseStreaming.ts`). Used because Chrome's demuxer
 *   prescans a fragmented file — downloading it whole — before it starts.
 *
 * The path is detected by sniffing the first bytes of the file, then falls
 * back on failure: MSE → Service Worker → full download (see
 * `resolvePreviewOutput`).
 *
 * The returned `url` is `undefined` while a path is still being chosen (with
 * `isLoading: true`), and it changes if a running path degrades to a fallback —
 * so treat it as the current URL, not a stable one.
 */
export function useVideoStreaming({ drive, nodeUid, mimeType, mediaDuration }: UseVideoStreamingProps) {
    // Per-node id used to route SW stream requests and build the <video> src below. It must
    // change per node so the URL changes and the <video> reloads on navigation in the preview.
    const streamId = `stream-id-for-${nodeUid}`;
    const swTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isBrokenVideo, setIsBrokenVideo] = useState(false);
    const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

    const [streamingMode, setStreamingMode] = useState<StreamingMode>('detecting');
    // Mirror of `streamingMode` for reads inside stable callbacks (e.g.
    // `handleBrokenVideo`), where the state value would be a stale closure.
    const streamingModeRef = useRef<StreamingMode>('detecting');
    const setMode = useCallback((mode: StreamingMode) => {
        streamingModeRef.current = mode;
        setStreamingMode(mode);
    }, []);
    const [mseUrl, setMseUrl] = useState<string | undefined>(undefined);
    const mseHandleRef = useRef<MseStreamHandle | undefined>(undefined);
    const swFallbackRef = useRef<(() => void) | null>(null);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const seekListenerRef = useRef<(() => void) | null>(null);
    // Attach a `seeking` listener so the MSE stream can fetch the target region.
    // We manage it here because this hook owns the <video> element reference.
    const attachVideoElement = useCallback((element: HTMLVideoElement | null) => {
        const previous = videoElementRef.current;
        if (previous && seekListenerRef.current) {
            previous.removeEventListener('seeking', seekListenerRef.current);
            seekListenerRef.current = null;
        }
        videoElementRef.current = element;
        if (element) {
            const listener = () => mseHandleRef.current?.onSeek();
            seekListenerRef.current = listener;
            element.addEventListener('seeking', listener);
        }
    }, []);

    const isServiceWorkerAvailable = useMemo(() => !!navigator.serviceWorker, []);
    // Not gated on canHtmlVideoPlay(mimeType): the stored mimeType is extension-derived and can
    // be wrong (e.g. an MP4 re-exported with a `.avi` extension), while the <video> element
    // decodes from real bytes. A genuinely unplayable file sets isBrokenVideo via
    // onVideoPlaybackError, which flips this back to false and degrades to Buffer mode.
    const isStreamableVideo = useMemo(() => {
        return !!mimeType && isVideo(mimeType) && isServiceWorkerAvailable && !isBrokenVideo;
    }, [mimeType, isServiceWorkerAvailable, isBrokenVideo]);

    const streamPromiseRef = useRef<Promise<{ stream: SeekableReadableStream; claimedTotalSize?: number }> | undefined>(
        undefined
    );
    const messageQueueRef = useRef<Promise<void>>(Promise.resolve());

    const clearSerwiceWorkerTimeout = () => {
        if (swTimeoutRef.current) {
            clearTimeout(swTimeoutRef.current);
            swTimeoutRef.current = null;
        }
    };

    const handleBrokenVideo = useCallback(
        (error?: SyntheticEvent<HTMLVideoElement, Event> | Error | unknown) => {
            // A failure while MSE is the active mechanism degrades to the Service
            // Worker path rather than abandoning streaming. Only if the Service
            // Worker also fails do we give up and let the preview fall back to a
            // full download (see resolvePreviewOutput). This is the MSE → SW →
            // full-load cascade.
            if (streamingModeRef.current === 'mse' && swFallbackRef.current) {
                logger.warn(`MSE streaming failed, falling back to Service Worker: ${errorToString(error)}`);
                mseHandleRef.current?.dispose();
                mseHandleRef.current = undefined;
                setMseUrl(undefined);
                swFallbackRef.current();
                return;
            }

            let videoError;
            if (error instanceof Error) {
                videoError = error;
            } else {
                const eventDetails = serializaEventPayload(error);
                const logMessage = eventDetails ? JSON.stringify(eventDetails) : errorToString(error);

                logger.warn(`Video streaming failed because of error: ${logMessage}`);

                videoError = new EnrichedError('Failed to load the video for streaming preview', {
                    extra: {
                        error,
                        eventDetails,
                        mimeType,
                    },
                });
            }

            if (error instanceof ServiceWorkerTimeoutError) {
                metrics.drive_warnings_total.increment({ warning: 'cannot_init_sw' });
            } else if (!canHtmlVideoPlay(mimeType)) {
                // The browser can't decode this container (real AVI/MKV/WMV), so degrading to Buffer
                // mode is expected. Reported at "debug" level to keep the mimeType trend without noise.
                logger.debug(`Video streaming unavailable for undecodable mimeType ${mimeType}`);
                traceError(videoError, {
                    level: 'debug',
                    tags: {
                        component: 'drive-preview-streaming',
                        ...(mimeType && { mimeType }),
                    },
                });
            } else {
                sendErrorReport(videoError);
            }

            clearSerwiceWorkerTimeout();
            setIsBrokenVideo(true);
        },
        [mimeType]
    );

    const initServiceWorker = (abortController: AbortController) => {
        initDownloadSW().catch((err) => {
            handleBrokenVideo(err);
            abortController.abort();
        });

        swTimeoutRef.current = setTimeout(() => {
            handleBrokenVideo(new ServiceWorkerTimeoutError('Service Worker timeout: not ready within 15 seconds'));
        }, SW_READY_TIMEOUT);

        void navigator.serviceWorker.ready
            .then(() => {
                if (swTimeoutRef.current) {
                    clearTimeout(swTimeoutRef.current);
                    swTimeoutRef.current = null;
                }
                setIsServiceWorkerReady(true);
            })
            .catch((err) => {
                handleBrokenVideo(err);
                abortController.abort();
            });
    };

    const initStreamPromise = async (
        abortSignal: AbortSignal
    ): Promise<{ stream: SeekableReadableStream; claimedTotalSize?: number }> => {
        const downloader = await drive.getFileDownloader(nodeUid, abortSignal);
        const claimedTotalSize = downloader.getClaimedSizeInBytes();
        const stream = downloader.getSeekableStream();
        return { stream, claimedTotalSize };
    };

    const handleMessage = async (abortController: AbortController, event: MessageEvent) => {
        const eventData = event.data as {
            type?: string;
            streamId?: string;
            range: [number, number];
        };
        if (eventData.type !== 'get_stream_chunk' || eventData.streamId !== streamId || !event.ports?.[0]) {
            return;
        }

        const port = event.ports[0];

        const [start, end] = eventData.range;
        const numberOfBytes = end - start + 1;

        try {
            if (!streamPromiseRef.current) {
                streamPromiseRef.current = initStreamPromise(abortController.signal);
            }

            const { stream, claimedTotalSize } = await streamPromiseRef.current;
            await stream.seek(start);
            const result = await stream.read(numberOfBytes);

            // When the stream reach the end, the stream is closed.
            // The playback might check the end of the stream anytime
            // but we want to continue to read the stream. Thus we need
            // to re-create it manually.
            if (result.done) {
                streamPromiseRef.current = undefined;
            }

            port.postMessage({
                data: result.value,
                claimedTotalSize,
                mimeType,
            });
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            handleBrokenVideo(error);
        }
    };

    useEffect(() => {
        if (!isStreamableVideo) {
            return;
        }

        const abortController = new AbortController();
        const { signal } = abortController;

        const messageHandler = (event: MessageEvent) => {
            // Chain message handling to ensure sequential processing.
            // We cannot seek to different place while read is in progress.
            messageQueueRef.current = messageQueueRef.current.then(() => handleMessage(abortController, event));
        };

        const startServiceWorkerStreaming = () => {
            setMode('sw');
            initServiceWorker(abortController);
            streamPromiseRef.current = initStreamPromise(signal);
            navigator.serviceWorker.addEventListener('message', messageHandler);
        };
        // Exposed so a mid-stream MSE failure can degrade to this path.
        swFallbackRef.current = startServiceWorkerStreaming;

        // Fragmented MP4 doesn't play through the Service Worker range server on
        // Chrome (it prescans the whole file first), so detect it and switch to
        // MSE. Everything else keeps the Service Worker path.
        const start = async () => {
            let head: Uint8Array<ArrayBuffer> | undefined;
            let createStream: (() => SeekableReadableStream) | undefined;
            let claimedTotalSize: number | undefined;
            try {
                const downloader = await drive.getFileDownloader(nodeUid, signal);
                createStream = () => downloader.getSeekableStream();
                claimedTotalSize = downloader.getClaimedSizeInBytes();
                // Read the head from a throwaway stream only to detect/sniff; the
                // MSE helper makes its own stream and reads from the start again.
                const detectStream = createStream();
                await detectStream.seek(0);
                // Copy the SDK's `Uint8Array<ArrayBufferLike>` into an
                // ArrayBuffer-backed view for the typed MSE helpers.
                head = new Uint8Array((await detectStream.read(MSE_HEAD_BYTES)).value);
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                logger.warn(`fMP4 detection failed, falling back to Service Worker: ${errorToString(error)}`);
            }

            if (signal.aborted) {
                return;
            }

            if (head && createStream && isFragmentedMp4(head)) {
                try {
                    const handle = startMseStream({
                        // The helper owns its stream fully: it creates one at the
                        // start and a fresh one after each read-to-end (the SDK
                        // stream closes for good once fully read, like the Service
                        // Worker path on `done`).
                        createStream,
                        initSegment: head,
                        durationSeconds: mediaDuration,
                        totalSize: claimedTotalSize,
                        getCurrentTime: () => videoElementRef.current?.currentTime ?? 0,
                        shouldStop: () => signal.aborted,
                        onError: handleBrokenVideo,
                    });
                    mseHandleRef.current = handle;
                    setMseUrl(handle.url);
                    setMode('mse');
                    return;
                } catch (error) {
                    logger.warn(`MSE setup failed, falling back to Service Worker: ${errorToString(error)}`);
                }
            }

            if (signal.aborted) {
                return;
            }
            startServiceWorkerStreaming();
        };

        void start();

        return () => {
            navigator.serviceWorker.removeEventListener('message', messageHandler);
            clearSerwiceWorkerTimeout();
            mseHandleRef.current?.dispose();
            mseHandleRef.current = undefined;
            swFallbackRef.current = null;
            setMseUrl(undefined);
            setMode('detecting');
            abortController.abort();
        };
    }, [nodeUid, isStreamableVideo]);

    if (!isStreamableVideo) {
        return undefined;
    }

    if (streamingMode === 'mse') {
        return {
            url: mseUrl,
            onVideoPlaybackError: handleBrokenVideo,
            isLoading: !mseUrl,
            videoRef: attachVideoElement,
        };
    }

    if (streamingMode === 'sw' && isServiceWorkerReady) {
        return {
            url: `/sw/stream/${streamId}`,
            onVideoPlaybackError: handleBrokenVideo,
            isLoading: false,
        };
    }

    return {
        url: undefined,
        onVideoPlaybackError: handleBrokenVideo,
        isLoading: true,
    };
}

/**
 * Extracts serializable data from a React SyntheticEvent (or event-like object)
 * so Sentry receives useful context instead of "[SyntheticEvent]".
 */
function serializaEventPayload(
    error: SyntheticEvent<HTMLVideoElement, Event> | unknown
): Record<string, unknown> | undefined {
    if (!error || typeof error !== 'object') {
        return undefined;
    }
    const e = error as Record<string, unknown>;
    const hasEventShape = 'target' in e && ('type' in e || 'nativeEvent' in e);
    if (!hasEventShape) {
        return undefined;
    }
    const payload: Record<string, unknown> = {
        eventType: typeof e.type === 'string' ? e.type : undefined,
    };
    const target = e.target as HTMLVideoElement | undefined;
    if (target?.error) {
        const mediaError = target.error;
        payload.mediaErrorCode = mediaError.code;
        payload.mediaErrorMessage = mediaError.message || undefined;
    }
    if (target && 'networkState' in target) {
        payload.networkState = target.networkState;
        payload.readyState = target.readyState;
    }
    return payload;
}
