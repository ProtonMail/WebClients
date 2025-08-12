import { useCallback, useEffect, useRef } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { ThumbnailType, useDrive } from '@proton/drive/index';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useThumbnailStore } from '../../zustand/thumbnail/thumbnail.store';

interface ThumbnailItem {
    uid: string;
    thumbnailId: string;
    hasThumbnail: boolean;
    cachedThumbnailUrl?: string;
}

interface UseBatchThumbnailLoaderOptions {
    intervalMs?: number;
    thumbnailType?: ThumbnailType;
}

/*
 * Hook for loading thumbnails in batches. Uses a simple interval to process
 * all queued thumbnail requests every 100ms.
 * This allow you to ask for the load of thumbnail one by one but using the iterating loop of sdk.
 */
export const useBatchThumbnailLoader = ({
    intervalMs = 100,
    thumbnailType = ThumbnailType.Type1,
}: UseBatchThumbnailLoaderOptions = {}) => {
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();

    const { thumbnails, setThumbnail } = useThumbnailStore(
        useShallow((state) => ({
            thumbnails: state.thumbnails,
            setThumbnail: state.setThumbnail,
        }))
    );

    const pendingItems = useRef<Map<string, ThumbnailItem>>(new Map());
    const isProcessing = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const processBatchRef = useRef<() => Promise<void>>();

    const processBatch = useCallback(async () => {
        if (isProcessing.current || pendingItems.current.size === 0) {
            return;
        }
        isProcessing.current = true;
        const itemsToProcess = Array.from(pendingItems.current.values());
        const uidsToProcess = itemsToProcess.map((item) => item.uid);

        itemsToProcess.forEach((item) => pendingItems.current.delete(item.uid));

        try {
            for await (const thumbnailResult of drive.iterateThumbnails(uidsToProcess, thumbnailType)) {
                const item = itemsToProcess.find((item) => item.uid === thumbnailResult.nodeUid);
                if (!item) {
                    continue;
                }

                if (thumbnailResult.ok) {
                    const url = URL.createObjectURL(new Blob([thumbnailResult.thumbnail as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }));
                    setThumbnail(item.thumbnailId, { sdUrl: url });
                } else {
                    setThumbnail(item.thumbnailId, {});
                }
            }
        } catch (error) {
            handleError(error, { showNotification: false });
            itemsToProcess.forEach((item) => setThumbnail(item.thumbnailId, {}));
        } finally {
            isProcessing.current = false;

            // Stop interval only if queue is still empty after processing
            // This prevents stopping the interval if new items were added during processing
            if (pendingItems.current.size === 0 && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }, [drive, thumbnailType, setThumbnail, handleError]);

    processBatchRef.current = processBatch;

    const startInterval = useCallback(() => {
        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                if (processBatchRef.current) {
                    processBatchRef.current();
                }
            }, intervalMs);
        }
    }, [intervalMs]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            pendingItems.current.clear();
        };
    }, []);

    const loadThumbnail = useCallback(
        (item: ThumbnailItem) => {
            if (!item.hasThumbnail || item.cachedThumbnailUrl || thumbnails[item.thumbnailId] !== undefined) {
                return;
            }

            if (!pendingItems.current.has(item.uid)) {
                const wasEmpty = pendingItems.current.size === 0;
                pendingItems.current.set(item.uid, item);

                if (wasEmpty) {
                    startInterval();
                }
            }
        },
        [thumbnails, startInterval]
    );

    return { loadThumbnail };
};
