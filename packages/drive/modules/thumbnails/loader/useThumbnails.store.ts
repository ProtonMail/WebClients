import { ThumbnailType } from '@protontech/drive-sdk';
import { create } from 'zustand';

import { handleDriveError } from '../../../internal/handleDriveError';
import { logger } from './logger';
import type { DriveClient, ThumbnailData, ThumbnailRequest } from './types';

/**
 * Returns whether the given thumbnail type is HD (Type2).
 * Used to derive the correct status/url keys for the ThumbnailData entry.
 */
const isHdType = (thumbnailType: ThumbnailType) => thumbnailType === ThumbnailType.Type2;

const getStatusKey = (thumbnailType: ThumbnailType): 'sdStatus' | 'hdStatus' =>
    isHdType(thumbnailType) ? 'hdStatus' : 'sdStatus';

const getUrlKey = (thumbnailType: ThumbnailType): 'sdUrl' | 'hdUrl' => (isHdType(thumbnailType) ? 'hdUrl' : 'sdUrl');

const shouldProcess = (item: ThumbnailRequest) => !item.shouldLoad || item.shouldLoad();

/**
 * Internal state for one (drive, thumbnailType) batch.
 *
 * Items accumulate in `pendingItems` and are flushed together every
 * BATCH_INTERVAL_MS. While a flush is running `isProcessing` is true so
 * concurrent interval ticks are no-ops. The interval is cleared once the
 * queue drains.
 */
interface BatchState {
    pendingItems: Map<string, ThumbnailRequest>;
    isProcessing: boolean;
    intervalRef: ReturnType<typeof setInterval> | null;
    thumbnailType: ThumbnailType;
}

/** How long to wait before flushing a batch after the first item is queued. */
const BATCH_INTERVAL_MS = 100;

/**
 * Produces a unique key used by the `attempted` set to track which
 * (revisionUid, thumbnailType) pairs have already been fetched, preventing
 * duplicate requests after a successful or failed load.
 */
const attemptedKey = (revisionUid: string, thumbnailType: ThumbnailType) => `${revisionUid}:${thumbnailType}`;

/**
 * Returns the existing batch for (drive, thumbnailType), creating the
 * necessary map entries if they don't exist yet.
 *
 * Batches are keyed by drive instance so that different drive clients
 * (e.g. regular drive vs. photos drive) never share a queue.
 */
const getOrCreateBatch = (
    drive: DriveClient,
    thumbnailType: ThumbnailType,
    batches: Map<DriveClient, Map<ThumbnailType, BatchState>>
): BatchState => {
    let driveMap = batches.get(drive);
    if (!driveMap) {
        driveMap = new Map();
        batches.set(drive, driveMap);
    }
    let batch = driveMap.get(thumbnailType);
    if (!batch) {
        batch = {
            pendingItems: new Map(),
            isProcessing: false,
            intervalRef: null,
            thumbnailType,
        };
        driveMap.set(thumbnailType, batch);
    }
    return batch;
};

type SetThumbnailData = (id: string, data: Partial<ThumbnailData>) => void;

/**
 * Drains the pending queue for a single (drive, thumbnailType) batch.
 *
 * - Skips items whose `shouldLoad` guard returns false at flush time.
 * - On success, creates a blob URL and updates the store.
 * - On a failed result (ok=false), marks the entry as loaded with no URL.
 * - On a thrown error, marks all items as loaded and reports via handleSdkError.
 * - In all cases, records the attempt so the item won't be re-queued.
 * - Clears the interval once the queue is empty after processing.
 */
const processBatch = async (
    drive: DriveClient,
    batch: BatchState,
    setThumbnailData: SetThumbnailData,
    attempted: Set<string>
): Promise<void> => {
    if (batch.isProcessing || batch.pendingItems.size === 0) {
        return;
    }

    const statusKey = getStatusKey(batch.thumbnailType);
    const urlKey = getUrlKey(batch.thumbnailType);

    batch.isProcessing = true;
    const allItems = Array.from(batch.pendingItems.values());
    allItems.forEach((item) => batch.pendingItems.delete(item.nodeUid));
    const itemsToProcess = allItems.filter(shouldProcess);
    const uidsToProcess = itemsToProcess.map((item) => item.nodeUid);

    logger.debug(`Processing batch of ${uidsToProcess.length} thumbnails (type: ${batch.thumbnailType})`);

    try {
        for await (const thumbnailResult of drive.iterateThumbnails(uidsToProcess, batch.thumbnailType)) {
            const item = itemsToProcess.find((item) => item.nodeUid === thumbnailResult.nodeUid);
            if (!item || !shouldProcess(item)) {
                continue;
            }

            attempted.add(attemptedKey(item.revisionUid, batch.thumbnailType));

            if (thumbnailResult.ok) {
                const url = URL.createObjectURL(
                    new Blob([thumbnailResult.thumbnail as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
                );
                setThumbnailData(item.revisionUid, { [statusKey]: 'loaded', [urlKey]: url });
                logger.debug(`Thumbnail loaded: ${item.revisionUid} (type: ${batch.thumbnailType})`);
            } else {
                setThumbnailData(item.revisionUid, { [statusKey]: 'loaded' });
                logger.debug(`Thumbnail not available: ${item.revisionUid} (type: ${batch.thumbnailType})`);
            }
        }
    } catch (error) {
        logger.warn(`Batch processing failed (type: ${batch.thumbnailType}): ${error}`);
        handleDriveError(error);
        itemsToProcess.filter(shouldProcess).forEach((item) => {
            attempted.add(attemptedKey(item.revisionUid, batch.thumbnailType));
            setThumbnailData(item.revisionUid, { [statusKey]: 'loaded' });
        });
    } finally {
        batch.isProcessing = false;
        if (batch.pendingItems.size === 0 && batch.intervalRef) {
            clearInterval(batch.intervalRef);
            batch.intervalRef = null;
        }
    }
};

type ThumbnailsStore = {
    /** Map of revisionUid → ThumbnailData. Reactive — components subscribe to this. */
    thumbnails: Map<string, ThumbnailData>;
    /**
     * Tracks (revisionUid, thumbnailType) pairs that have been attempted.
     * Mutated directly (not via set) intentionally — it is not reactive state,
     * just a deduplication guard.
     */
    attempted: Set<string>;
    /**
     * Nested map of drive → thumbnailType → BatchState.
     * Mutated directly for the same reason as `attempted`.
     */
    batches: Map<DriveClient, Map<ThumbnailType, BatchState>>;

    getThumbnail: (revisionUid: string) => ThumbnailData | undefined;
    loadThumbnail: (drive: DriveClient, item: ThumbnailRequest) => void;
};

export const useThumbnailsStore = create<ThumbnailsStore>((set, get) => ({
    thumbnails: new Map<string, ThumbnailData>(),
    attempted: new Set<string>(),
    batches: new Map<DriveClient, Map<ThumbnailType, BatchState>>(),

    getThumbnail: (revisionUid: string) => get().thumbnails.get(revisionUid),

    /**
     * Queues a thumbnail item for loading. For each requested type:
     * - Skips if already attempted.
     * - Sets the status to 'loading' immediately (if shouldLoad passes).
     * - Adds the item to the appropriate (drive, type) batch.
     * - Starts the batch interval if this is the first item in the queue.
     */
    loadThumbnail: (drive, item) => {
        // Map public interface to SDK interface
        const thumbnailTypes = item.thumbnailTypes
            ? item.thumbnailTypes.map((type) => (type === 'hd' ? ThumbnailType.Type2 : ThumbnailType.Type1))
            : [ThumbnailType.Type1];

        const { attempted, batches } = get();

        const setThumbnailData: SetThumbnailData = (id, data) =>
            set((state) => {
                const thumbnails = new Map(state.thumbnails);
                thumbnails.set(id, { ...thumbnails.get(id), ...data });
                return { thumbnails };
            });

        for (const thumbnailType of thumbnailTypes) {
            if (attempted.has(attemptedKey(item.revisionUid, thumbnailType))) {
                continue;
            }

            const statusKey = getStatusKey(thumbnailType);

            const batch = getOrCreateBatch(drive, thumbnailType, batches);
            if (!batch.pendingItems.has(item.nodeUid)) {
                logger.debug(`Queuing thumbnail: ${item.revisionUid} uid: ${item.nodeUid} (type: ${thumbnailType})`);
                const wasEmpty = batch.pendingItems.size === 0;
                batch.pendingItems.set(item.nodeUid, item);

                if (shouldProcess(item)) {
                    set((state) => {
                        const thumbnails = new Map(state.thumbnails);
                        thumbnails.set(item.revisionUid, {
                            ...thumbnails.get(item.revisionUid),
                            [statusKey]: 'loading',
                        });
                        return { thumbnails };
                    });
                }

                if (wasEmpty && !batch.intervalRef) {
                    batch.intervalRef = setInterval(() => {
                        void processBatch(drive, batch, setThumbnailData, get().attempted);
                    }, BATCH_INTERVAL_MS);
                }
            }
        }
    },
}));
