import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { type SeekableReadableStream, useDrive } from '@proton/drive';
import metrics from '@proton/metrics/index';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { logging } from '../../modules/logging';
import { initDownloadSW } from '../../store/_downloads/fileSaver/download';
import { errorToString, sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';

const logger = logging.getLogger('preview-streaming');

type UseVideoStreamingProps = {
    nodeUid: string;
    mimeType?: string;
};

const SW_READY_TIMEOUT = 15 * 1000; // 15 seconds for SW to register

class ServiceWorkerTimeoutError extends Error {}

export function useVideoStreaming({ nodeUid, mimeType }: UseVideoStreamingProps) {
    const { drive } = useDrive();

    const [streamId] = useState<string>(() => uuidv4());
    const swTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isBrokenVideo, setIsBrokenVideo] = useState(false);
    const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

    const isServiceWorkerAvailable = useMemo(() => 'serviceWorker' in navigator, []);
    const isStreamableVideo = useMemo(() => {
        return mimeType && isVideo(mimeType) && isServiceWorkerAvailable && !isBrokenVideo;
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

    const handleBrokenVideo = useCallback((error?: SyntheticEvent<HTMLVideoElement, Event> | Error | unknown) => {
        let videoError;
        if (error instanceof Error) {
            videoError = error;
        } else {
            let eventErrorMessage;
            try {
                eventErrorMessage = (error as any)?.target?.error?.message;
            } catch {
                // We take the message from the event for simpler debugging.
                // If its not there, we ignore the error as we still provide the full error event.
            }

            if (eventErrorMessage) {
                logger.warn(`Video streaming failed because of event error: ${eventErrorMessage}`);
            } else {
                logger.warn(`Video streaming failed because of error: ${errorToString(error)}`);
            }

            videoError = new EnrichedError('Failed to load the video for streaming preview', {
                extra: {
                    error,
                    eventErrorMessage,
                },
            });
        }

        if (error instanceof ServiceWorkerTimeoutError) {
            metrics.drive_warnings_total.increment({ warning: 'cannot_init_sw' });
        } else {
            sendErrorReport(videoError);
        }

        clearSerwiceWorkerTimeout();
        setIsBrokenVideo(true);
    }, []);

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
            handleBrokenVideo(error);
        }
    };

    useEffect(() => {
        if (!isStreamableVideo) {
            return;
        }

        const abortController = new AbortController();
        initServiceWorker(abortController);
        streamPromiseRef.current = initStreamPromise(abortController.signal);

        const messageHandler = (event: MessageEvent) => {
            // Chain message handling to ensure sequential processing.
            // We cannot seek to different place while read is in progress.
            messageQueueRef.current = messageQueueRef.current.then(() => handleMessage(abortController, event));
        };
        navigator.serviceWorker.addEventListener('message', messageHandler);

        return () => {
            navigator.serviceWorker.removeEventListener('message', messageHandler);
            clearSerwiceWorkerTimeout();
            abortController.abort();
        };
    }, [nodeUid, isStreamableVideo]);

    if (!isStreamableVideo) {
        return undefined;
    }

    if (!isServiceWorkerReady) {
        return {
            url: undefined,
            onVideoPlaybackError: handleBrokenVideo,
            isLoading: true,
        };
    }

    return {
        url: `/sw/stream/${streamId}`,
        onVideoPlaybackError: handleBrokenVideo,
        isLoading: false,
    };
}
