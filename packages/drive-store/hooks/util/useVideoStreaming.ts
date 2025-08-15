import { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { initDownloadSW } from '../../store/_downloads/fileSaver/download';
import { sendErrorReport } from '../../utils/errorHandling';

type UseVideoStreamingProps = {
    mimeType?: string;
    videoData?: {
        blockSizes: number[];
    };
    downloadSlice?: (abortSignal: AbortSignal, indices: number[]) => Promise<Uint8Array<ArrayBuffer>[] | undefined>;
};

const FIRST_BLOCK_TIMEOUT = 30000; // 30 seconds for first block to be downloaded
const SW_READY_TIMEOUT = 15 * 1000; // 15 seconds for SW to register

export const useVideoStreaming = ({ mimeType, videoData, downloadSlice }: UseVideoStreamingProps) => {
    const [streamId] = useState<string>(() => uuidv4());
    const swTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const blockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const firstBlockRequestedRef = useRef<boolean>(false);

    const handleBrokenVideo = useCallback((error?: unknown) => {
        sendErrorReport(error);
        if (swTimeoutRef.current) {
            clearTimeout(swTimeoutRef.current);
            swTimeoutRef.current = null;
        }
        if (blockTimeoutRef.current) {
            clearTimeout(blockTimeoutRef.current);
            blockTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (mimeType && isVideo(mimeType)) {
            void initDownloadSW();
        }
    }, [mimeType]);

    useEffect(() => {
        if (!videoData || !downloadSlice || !mimeType || !isVideo(mimeType)) {
            return;
        }
        if (!('serviceWorker' in navigator)) {
            handleBrokenVideo(new Error('Service Worker not supported'));
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
            } catch (err) {
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
    }, [handleBrokenVideo, videoData, streamId, mimeType, downloadSlice]);

    return videoData
        ? {
              url: `/sw/video/${streamId}`,
              onVideoPlaybackError: handleBrokenVideo,
          }
        : undefined;
};
