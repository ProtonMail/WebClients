import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { initDownloadSW } from '../../store/_downloads/fileSaver/download';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';

type UseVideoStreamingProps = {
    mimeType?: string;
    videoData?: {
        blockSizes: number[];
    };
    downloadSlice?: (abortSignal: AbortSignal, indices: number[]) => Promise<Uint8Array[] | undefined>;
};
const FIRST_BLOCK_TIMEOUT = 30000; // 30 seconds for first block to be downloaded
const SW_READY_TIMEOUT = 15 * 1000; // 15 seconds for SW to register

export const useVideoStreaming = ({ mimeType, videoData, downloadSlice }: UseVideoStreamingProps) => {
    const [streamId] = useState<string>(() => uuidv4());
    const swTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const blockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const firstBlockRequestedRef = useRef<boolean>(false);
    const [isBrokenVideo, setIsBrokenVideo] = useState(false);

    const isServiceWorkerAvailable = useMemo(() => 'serviceWorker' in navigator, []);

    const handleBrokenVideo = useCallback((error?: SyntheticEvent<HTMLVideoElement, Event> | Error | unknown) => {
        let videoError;
        // TODO: Update it to Error.isError() when Typescript will include it in esnext
        if (error instanceof Error) {
            videoError = error;
        } else {
            videoError = new EnrichedError('Failed to load the video', {
                extra: {
                    error,
                },
            });
        }
        sendErrorReport(videoError);
        if (swTimeoutRef.current) {
            clearTimeout(swTimeoutRef.current);
            swTimeoutRef.current = null;
        }
        if (blockTimeoutRef.current) {
            clearTimeout(blockTimeoutRef.current);
            blockTimeoutRef.current = null;
        }
        setIsBrokenVideo(true);
    }, []);

    useEffect(() => {
        if (mimeType && isVideo(mimeType) && isServiceWorkerAvailable) {
            void initDownloadSW();
        }
    }, [mimeType, isServiceWorkerAvailable]);

    useEffect(() => {
        if (
            !videoData ||
            !downloadSlice ||
            !mimeType ||
            !isVideo(mimeType) ||
            !isServiceWorkerAvailable ||
            isBrokenVideo
        ) {
            return;
        }

        swTimeoutRef.current = setTimeout(() => {
            handleBrokenVideo(new Error('Service Worker timeout: not ready within 15 seconds'));
        }, SW_READY_TIMEOUT);

        void navigator.serviceWorker.ready
            .then(() => {
                if (swTimeoutRef.current) {
                    clearTimeout(swTimeoutRef.current);
                    swTimeoutRef.current = null;
                }

                const controller = navigator.serviceWorker.controller;
                const sendBlockSizes = () => {
                    controller?.postMessage({
                        type: 'set_video_stream',
                        blockSizes: videoData.blockSizes,
                        id: streamId,
                        mimeType,
                    });
                };

                if (controller) {
                    sendBlockSizes();
                } else {
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        sendBlockSizes();
                    });
                }
            })
            .catch((err) => {
                handleBrokenVideo(err);
            });

        const messageHandler = async (event: MessageEvent) => {
            const data = event.data as { type?: string; indices?: number[] };
            if (data.type !== 'get_block_data' || !event.ports?.[0]) {
                return;
            }

            const port = event.ports[0];
            const indices = data.indices!;

            if (!firstBlockRequestedRef.current) {
                firstBlockRequestedRef.current = true;
                blockTimeoutRef.current = setTimeout(() => {
                    handleBrokenVideo(new Error('First block timeout: no data received within 30 seconds'));
                }, FIRST_BLOCK_TIMEOUT);
            }

            try {
                const ac = new AbortController();
                const slices = await downloadSlice(ac.signal, indices);

                if (blockTimeoutRef.current) {
                    clearTimeout(blockTimeoutRef.current);
                    blockTimeoutRef.current = null;
                }

                if (slices) {
                    port.postMessage(slices);
                } else {
                    handleBrokenVideo(new Error('downloadSlice returned no data for indices'));
                }
            } catch (err: unknown) {
                handleBrokenVideo(err);
            }
        };

        navigator.serviceWorker.addEventListener('message', messageHandler);

        return () => {
            navigator.serviceWorker.removeEventListener('message', messageHandler);

            if (swTimeoutRef.current) {
                clearTimeout(swTimeoutRef.current);
            }
            if (blockTimeoutRef.current) {
                clearTimeout(blockTimeoutRef.current);
            }
        };
    }, [handleBrokenVideo, videoData, streamId, mimeType, downloadSlice, isServiceWorkerAvailable, isBrokenVideo]);

    return videoData && !isBrokenVideo && isServiceWorkerAvailable
        ? {
              url: `/sw/video/${streamId}`,
              onVideoPlaybackError: handleBrokenVideo,
          }
        : undefined;
};
