import { ThumbnailType } from '@protontech/drive-sdk';
import { create } from 'zustand';

import { handleSdkError } from '../../../legacy/errorHandling';
import { getCachedThumbnail, setCachedThumbnail } from '../encryptedThumbnailCache';
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
 * Key under which a thumbnail is stored and deduplicated. Defaults to
 * `revisionUid` (so a new revision invalidates the cached thumbnail), falling
 * back to `nodeUid` for single-revision nodes that load without a revision.
 */
const storeKeyOf = ({ revisionUid, nodeUid }: ThumbnailRequest) => revisionUid ?? nodeUid;

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
 * How many thumbnails to fetch per chunk while draining a batch. The queue is
 * re-read between chunks, so thumbnails scrolled out of view (now unmounted)
 * are dropped and freshly-visible ones are picked up. Kept small (around the
 * browser's per-origin HTTP/1.1 connection limit) so scrolling re-prioritises
 * quickly instead of waiting behind one large in-flight request.
 */
const PROCESS_CHUNK_SIZE = 10;

/**
 * Produces a unique key used by the `attempted` set to track which
 * (thumbnailKey, thumbnailType) pairs have already been fetched, preventing
 * duplicate requests after a successful or failed load. `thumbnailKey` is the
 * store key — see `storeKeyOf`.
 */
const attemptedKey = (thumbnailKey: string, thumbnailType: ThumbnailType) => `${thumbnailKey}:${thumbnailType}`;

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
 * The queue is drained in small chunks (PROCESS_CHUNK_SIZE), in queue order.
 * Because the queue is re-read between chunks, thumbnails scrolled out of view
 * are dropped (their `shouldLoad` guard fails once unmounted) and freshly
 * visible ones are picked up - instead of everything waiting behind one large
 * in-flight request fetching items the user has already scrolled past.
 *
 * Per chunk:
 * - Skips items whose `shouldLoad` guard returns false at flush time.
 * - On success, creates a blob URL and updates the store.
 * - On a failed result (ok=false), marks the entry as loaded with no URL.
 * - On a thrown error, marks the chunk's items as loaded and reports via handleSdkError.
 * - In all cases, records the attempt so the item won't be re-queued.
 *
 * Once the queue is empty the interval is cleared. SD (Type1) batches are
 * prioritised: the HD (Type2) interval only starts after the SD batch finishes,
 * ensuring lower-resolution previews appear first.
 */
const processBatch = async (
    drive: DriveClient,
    batch: BatchState,
    batches: Map<DriveClient, Map<ThumbnailType, BatchState>>,
    setThumbnailData: SetThumbnailData,
    attempted: Set<string>
): Promise<void> => {
    if (batch.isProcessing || batch.pendingItems.size === 0) {
        return;
    }

    const statusKey = getStatusKey(batch.thumbnailType);
    const urlKey = getUrlKey(batch.thumbnailType);
    const cacheType = isHdType(batch.thumbnailType) ? 'hd' : 'sd';

    batch.isProcessing = true;

    try {
        while (batch.pendingItems.size > 0) {
            // Order by ascending viewport distance (0 = on screen, 1 = first row
            // past the edge, ...) so on-screen thumbnails are fetched first and the
            // pre-render margin rows fill in by proximity. Distance is evaluated
            // here, so it reflects the latest scroll position rather than where the
            // item was when it mounted. The sort is stable, so queue order
            // (top-to-bottom of the view) breaks ties at the same distance. Items
            // scrolled fully out of view have unmounted, so their `shouldLoad`
            // guard fails and they're filtered out below before any fetch.
            // Re-reading the queue each iteration also picks up items queued while
            // the previous chunk was in-flight.
            const chunk = Array.from(batch.pendingItems.values())
                .map((item) => ({ item, distance: item.viewportDistance ? item.viewportDistance() : 0 }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, PROCESS_CHUNK_SIZE)
                .map((entry) => entry.item);
            chunk.forEach((item) => batch.pendingItems.delete(item.nodeUid));

            let itemsToProcess = chunk.filter(shouldProcess);

            // Read-through persistent cache: for items that opted in via `usePersistentCache`,
            // serve them from the encrypted cache and only fetch the misses from the SDK.
            if (itemsToProcess.some((item) => item.usePersistentCache)) {
                const lookups = await Promise.all(
                    itemsToProcess.map(async (item) => ({
                        item,
                        cached: item.usePersistentCache
                            ? await getCachedThumbnail(storeKeyOf(item), cacheType)
                            : undefined,
                    }))
                );
                const misses: ThumbnailRequest[] = [];
                for (const { item, cached } of lookups) {
                    if (cached && shouldProcess(item)) {
                        const url = URL.createObjectURL(new Blob([cached], { type: 'image/jpeg' }));
                        attempted.add(attemptedKey(storeKeyOf(item), batch.thumbnailType));
                        setThumbnailData(storeKeyOf(item), { [statusKey]: 'loaded', [urlKey]: url });
                        logger.debug(`Thumbnail loaded from cache: ${storeKeyOf(item)}`);
                    } else {
                        misses.push(item);
                    }
                }
                itemsToProcess = misses;
            }

            const uidsToProcess = itemsToProcess.map((item) => item.nodeUid);
            if (uidsToProcess.length === 0) {
                continue;
            }

            logger.debug(`Processing chunk of ${uidsToProcess.length} thumbnails (type: ${batch.thumbnailType})`);

            try {
                for await (const thumbnailResult of drive.iterateThumbnails(uidsToProcess, batch.thumbnailType)) {
                    const item = itemsToProcess.find((item) => item.nodeUid === thumbnailResult.nodeUid);
                    if (!item || !shouldProcess(item)) {
                        continue;
                    }

                    attempted.add(attemptedKey(storeKeyOf(item), batch.thumbnailType));

                    if (thumbnailResult.ok) {
                        const thumbnailBytes = thumbnailResult.thumbnail as Uint8Array<ArrayBuffer>;
                        const url = URL.createObjectURL(new Blob([thumbnailBytes], { type: 'image/jpeg' }));
                        setThumbnailData(storeKeyOf(item), { [statusKey]: 'loaded', [urlKey]: url });
                        if (item.usePersistentCache) {
                            void setCachedThumbnail(storeKeyOf(item), cacheType, thumbnailBytes);
                        }
                        logger.debug(`Thumbnail loaded: ${storeKeyOf(item)} (type: ${batch.thumbnailType})`);
                    } else {
                        setThumbnailData(storeKeyOf(item), { [statusKey]: 'loaded' });
                        logger.debug(`Thumbnail not available: ${storeKeyOf(item)} (type: ${batch.thumbnailType})`);
                    }
                }
            } catch (error) {
                logger.warn(`Chunk processing failed (type: ${batch.thumbnailType}): ${error}`);
                handleSdkError(error, { showNotification: false });
                itemsToProcess.filter(shouldProcess).forEach((item) => {
                    attempted.add(attemptedKey(storeKeyOf(item), batch.thumbnailType));
                    setThumbnailData(storeKeyOf(item), { [statusKey]: 'loaded' });
                });
            }
        }
    } finally {
        batch.isProcessing = false;
        if (batch.pendingItems.size === 0 && batch.intervalRef) {
            clearInterval(batch.intervalRef);
            batch.intervalRef = null;
        }
        // SD (Type1) batches are processed first. Only once an SD batch finishes do we
        // kick off the HD (Type2) interval, so lower-resolution previews always appear
        // before their high-resolution counterparts.
        if (batch.thumbnailType === ThumbnailType.Type1) {
            const hdBatch = batches.get(drive)?.get(ThumbnailType.Type2);
            if (hdBatch && hdBatch.pendingItems.size > 0 && !hdBatch.intervalRef) {
                hdBatch.intervalRef = setInterval(() => {
                    void processBatch(drive, hdBatch, batches, setThumbnailData, attempted);
                }, BATCH_INTERVAL_MS);
            }
        }
    }
};

const startBatchInterval = (
    drive: DriveClient,
    batch: BatchState,
    batches: Map<DriveClient, Map<ThumbnailType, BatchState>>,
    setThumbnailData: SetThumbnailData,
    attempted: Set<string>
) => {
    batch.intervalRef = setInterval(() => {
        void processBatch(drive, batch, batches, setThumbnailData, attempted);
    }, BATCH_INTERVAL_MS);
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

    // If you use revision uid, make sure it was specified in the loadThumbnail request.
    getThumbnail: (nodeUidOrRevisionUid: string) => ThumbnailData | undefined;

    loadThumbnail: (drive: DriveClient, item: ThumbnailRequest) => void;
};

export const useThumbnailsStore = create<ThumbnailsStore>((set, get) => ({
    thumbnails: new Map<string, ThumbnailData>(),
    attempted: new Set<string>(),
    batches: new Map<DriveClient, Map<ThumbnailType, BatchState>>(),

    getThumbnail: (nodeUidOrRevisionUid: string) => get().thumbnails.get(nodeUidOrRevisionUid),

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
            if (attempted.has(attemptedKey(storeKeyOf(item), thumbnailType))) {
                continue;
            }

            const statusKey = getStatusKey(thumbnailType);

            const batch = getOrCreateBatch(drive, thumbnailType, batches);
            if (!batch.pendingItems.has(item.nodeUid)) {
                logger.debug(`Queuing thumbnail: ${storeKeyOf(item)} uid: ${item.nodeUid} (type: ${thumbnailType})`);
                const wasEmpty = batch.pendingItems.size === 0;
                batch.pendingItems.set(item.nodeUid, item);

                if (shouldProcess(item)) {
                    set((state) => {
                        const thumbnails = new Map(state.thumbnails);
                        thumbnails.set(storeKeyOf(item), {
                            ...thumbnails.get(storeKeyOf(item)),
                            [statusKey]: 'loading',
                        });
                        return { thumbnails };
                    });
                }

                if (wasEmpty && !batch.intervalRef) {
                    const sdBatch =
                        thumbnailType === ThumbnailType.Type2 ? batches.get(drive)?.get(ThumbnailType.Type1) : null;
                    const sdPending = sdBatch && (sdBatch.pendingItems.size > 0 || sdBatch.isProcessing);
                    if (!sdPending) {
                        startBatchInterval(drive, batch, batches, setThumbnailData, get().attempted);
                    }
                }
            }
        }
    },
}));
