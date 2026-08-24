import { ThumbnailType } from '@protontech/drive-sdk';
import { create } from 'zustand';

import { handleSdkError } from '../../../legacy/errorHandling';
import { logger } from './logger';
import { fetchThumbnails, storeKeyOf } from './thumbnailFetcher';
import {
    type DriveClient,
    THUMBNAIL_KEY_MAP,
    THUMBNAIL_TYPE_MAP,
    type ThumbnailData,
    type ThumbnailRequest,
} from './types';

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
    getThumbnailData: (id: string) => ThumbnailData | undefined,
    setThumbnailData: SetThumbnailData,
    attempted: Set<string>
): Promise<void> => {
    if (batch.isProcessing || batch.pendingItems.size === 0) {
        return;
    }

    const { statusKey, urlKey } = THUMBNAIL_KEY_MAP[batch.thumbnailType];

    // Settle an item to 'loaded' only if it was actually marked 'loading'.
    //
    // Flow:
    //   loadThumbnail() queues item
    //     ├── shouldLoad() true  → status = 'loading' ──→ settleIfPending: 'loading' → 'loaded' ✓
    //     └── shouldLoad() false → status stays unset  ──→ settleIfPending: skip (nothing to settle)
    //
    // Writing 'loaded' for an item that was never 'loading' would wrongly signal
    // "checked, no thumbnail" for a node that was never requested.
    const settleIfPending = (item: ThumbnailRequest) => {
        const id = storeKeyOf(item);
        if (getThumbnailData(id)?.[statusKey] === 'loading') {
            setThumbnailData(id, { [statusKey]: 'loaded' });
        }
    };

    batch.isProcessing = true;

    try {
        while (batch.pendingItems.size > 0) {
            // 1. Sort by viewport distance (0 = on screen, 1 = first row past the edge, ...)
            //    so on-screen items go first and margin rows fill in by proximity. Distance is
            //    read now, not at mount time, so it reflects the current scroll position. The
            //    sort is stable, so queue order breaks ties at equal distance.
            // 2. Take up to PROCESS_CHUNK_SIZE items from that sorted list.
            // 3. Drop them from the pending queue.
            // 4. Items scrolled fully out of view have unmounted — their `shouldLoad` guard
            //    fails and they're filtered out below before any fetch.
            // Re-reading the queue each iteration also picks up items queued while the
            // previous chunk was in-flight.
            const chunk = Array.from(batch.pendingItems.values())
                .map((item) => ({ item, distance: item.viewportDistance ? item.viewportDistance() : 0 }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, PROCESS_CHUNK_SIZE)
                .map((entry) => entry.item);
            chunk.forEach((item) => batch.pendingItems.delete(item.nodeUid));

            const itemsToProcess = chunk.filter(shouldProcess);
            chunk.filter((item) => !shouldProcess(item)).forEach(settleIfPending);
            if (itemsToProcess.length === 0) {
                continue;
            }

            logger.debug(`Processing chunk of ${itemsToProcess.length} thumbnails (type: ${batch.thumbnailType})`);

            try {
                const results = await fetchThumbnails(drive, itemsToProcess, batch.thumbnailType);
                for (const result of results) {
                    if (!shouldProcess(result.item)) {
                        // Scrolled out of view while the fetch was in flight.
                        settleIfPending(result.item);
                        continue;
                    }

                    attempted.add(attemptedKey(storeKeyOf(result.item), batch.thumbnailType));

                    if (result.ok && result.bytes) {
                        const url = URL.createObjectURL(new Blob([result.bytes], { type: 'image/jpeg' }));
                        setThumbnailData(storeKeyOf(result.item), { [statusKey]: 'loaded', [urlKey]: url });
                        logger.debug(
                            `Thumbnail loaded${result.fromCache ? ' from cache' : ''}: ${storeKeyOf(result.item)} (type: ${batch.thumbnailType})`
                        );
                    } else {
                        setThumbnailData(storeKeyOf(result.item), { [statusKey]: 'loaded' });
                        logger.debug(
                            `Thumbnail not available: ${storeKeyOf(result.item)} (type: ${batch.thumbnailType})`
                        );
                    }
                }

                // Items the SDK silently skipped (no error, just absent from `results`) never
                // hit the loop above, so settle them here or they stay 'loading' forever.
                const settled = new Set(results.map(({ item }) => item.nodeUid));
                itemsToProcess.filter((item) => !settled.has(item.nodeUid)).forEach(settleIfPending);
            } catch (error) {
                logger.warn(`Chunk processing failed (type: ${batch.thumbnailType}): ${error}`);
                handleSdkError(error, { showNotification: false });
                itemsToProcess.forEach((item) => {
                    if (!shouldProcess(item)) {
                        settleIfPending(item);
                        return;
                    }
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
                    void processBatch(drive, hdBatch, batches, getThumbnailData, setThumbnailData, attempted);
                }, BATCH_INTERVAL_MS);
            }
        }
    }
};

const startBatchInterval = (
    drive: DriveClient,
    batch: BatchState,
    batches: Map<DriveClient, Map<ThumbnailType, BatchState>>,
    getThumbnailData: (id: string) => ThumbnailData | undefined,
    setThumbnailData: SetThumbnailData,
    attempted: Set<string>
) => {
    batch.intervalRef = setInterval(() => {
        void processBatch(drive, batch, batches, getThumbnailData, setThumbnailData, attempted);
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
    getThumbnailFromCache: (nodeUidOrRevisionUid: string) => ThumbnailData | undefined;

    loadThumbnail: (drive: DriveClient, item: ThumbnailRequest) => void;

    /**
     * Like `loadThumbnail`, but waits for the thumbnail to finish loading and
     * returns the result instead of leaving the caller to poll or subscribe.
     */
    getThumbnail: (drive: DriveClient, item: ThumbnailRequest) => Promise<ThumbnailData | undefined>;

    /**
     * Gets raw thumbnail bytes for a node, trying each requested type in order (e.g. `['hd', 'sd']`
     * to prefer the best available look). Unlike `getThumbnail`, this returns the actual bytes: if
     * this call fetches them fresh, it hands them straight back; if they were already loaded by
     * someone else, it reads them back from the stored blob url (a local read, not a network call).
     */
    getThumbnailBytes: (drive: DriveClient, item: ThumbnailRequest) => Promise<Uint8Array<ArrayBuffer> | undefined>;
};

export const useThumbnailsStore = create<ThumbnailsStore>((set, get, api) => {
    const getThumbnailData = (id: string) => get().thumbnails.get(id);

    const setThumbnailData: SetThumbnailData = (id, data) =>
        set((state) => {
            const thumbnails = new Map(state.thumbnails);
            thumbnails.set(id, { ...thumbnails.get(id), ...data });
            return { thumbnails };
        });

    /**
     * Waits until (key, statusKey) leaves 'loading', however it gets there — this store has no
     * other way to be notified of a fetch someone else already started.
     */
    const waitUntilSettled = (key: string, statusKey: 'sdStatus' | 'hdStatus'): Promise<void> =>
        new Promise((resolve) => {
            const unsubscribe = api.subscribe((state) => {
                if (state.thumbnails.get(key)?.[statusKey] !== 'loading') {
                    unsubscribe();
                    resolve();
                }
            });
        });

    /**
     * Makes sure a thumbnail is loaded, without fetching it twice if multiple callers ask at the
     * same time. It uses the store's 'loading' status as a shared flag: if someone else already
     * started the fetch (via `loadThumbnail` or another call), this one just waits for them to
     * finish instead of firing off a second request.
     *
     * Used by both `getThumbnail` and `getThumbnailBytes`. It returns the raw bytes only when
     * this call did the fetching itself; otherwise it returns undefined so the caller can read
     * what was already stored.
     */
    const ensureThumbnailResolved = async (
        drive: DriveClient,
        item: ThumbnailRequest,
        key: string,
        type: ThumbnailType
    ): Promise<Uint8Array<ArrayBuffer> | undefined> => {
        const { statusKey, urlKey } = THUMBNAIL_KEY_MAP[type];

        if (get().thumbnails.get(key)?.[statusKey] === 'loading') {
            await waitUntilSettled(key, statusKey);
        }

        if (get().thumbnails.get(key)?.[statusKey] === 'loaded' && get().attempted.has(attemptedKey(key, type))) {
            return undefined;
        }

        // Claim it synchronously (before the SDK call below actually resolves) so a concurrent
        // caller for the same (key, type) sees 'loading' and waits instead of also fetching.
        setThumbnailData(key, { [statusKey]: 'loading' });

        try {
            const [result] = await fetchThumbnails(drive, [item], type);
            get().attempted.add(attemptedKey(key, type));

            if (result?.ok && result.bytes) {
                const bytes = result.bytes;
                const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
                setThumbnailData(key, { [statusKey]: 'loaded', [urlKey]: url });
                logger.debug(`Thumbnail loaded${result.fromCache ? ' from cache' : ''}: ${key} (type: ${type})`);
                return bytes;
            }

            logger.debug(`Thumbnail not available: ${key} (type: ${type})`);
            setThumbnailData(key, { [statusKey]: 'loaded' });
            return undefined;
        } catch (error) {
            // fetchThumbnails can reject before it settles anything (e.g. the persistent-cache
            // lookup throws) - without this, the status would stay 'loading' forever and every
            // later ensureThumbnailResolved for this key would hang on waitUntilSettled.
            logger.warn(`Fetching thumbnail failed: ${key} (type: ${type}): ${error}`);
            handleSdkError(error, { showNotification: false });
            get().attempted.add(attemptedKey(key, type));
            setThumbnailData(key, { [statusKey]: 'loaded' });
            return undefined;
        }
    };

    return {
        thumbnails: new Map<string, ThumbnailData>(),
        attempted: new Set<string>(),
        batches: new Map<DriveClient, Map<ThumbnailType, BatchState>>(),

        getThumbnailFromCache: (nodeUidOrRevisionUid: string) => get().thumbnails.get(nodeUidOrRevisionUid),

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

            for (const thumbnailType of thumbnailTypes) {
                if (attempted.has(attemptedKey(storeKeyOf(item), thumbnailType))) {
                    continue;
                }

                const { statusKey } = THUMBNAIL_KEY_MAP[thumbnailType];

                // A direct fetch (getThumbnail/getThumbnailBytes) may already be in flight for
                // this (key, type): it sets 'loading' before `attempted` is updated, so the check
                // above alone would let it get queued and fetched a second time here.
                if (getThumbnailData(storeKeyOf(item))?.[statusKey] === 'loading') {
                    continue;
                }

                const batch = getOrCreateBatch(drive, thumbnailType, batches);
                if (!batch.pendingItems.has(item.nodeUid)) {
                    logger.debug(
                        `Queuing thumbnail: ${storeKeyOf(item)} uid: ${item.nodeUid} (type: ${thumbnailType})`
                    );
                    const wasEmpty = batch.pendingItems.size === 0;
                    batch.pendingItems.set(item.nodeUid, item);

                    if (shouldProcess(item)) {
                        setThumbnailData(storeKeyOf(item), { [statusKey]: 'loading' });
                    }

                    if (wasEmpty && !batch.intervalRef) {
                        const sdBatch =
                            thumbnailType === ThumbnailType.Type2 ? batches.get(drive)?.get(ThumbnailType.Type1) : null;
                        const sdPending = sdBatch && (sdBatch.pendingItems.size > 0 || sdBatch.isProcessing);
                        if (!sdPending) {
                            startBatchInterval(
                                drive,
                                batch,
                                batches,
                                getThumbnailData,
                                setThumbnailData,
                                get().attempted
                            );
                        }
                    }
                }
            }
        },

        getThumbnail: async (drive, item) => {
            const thumbnailTypes = item.thumbnailTypes
                ? item.thumbnailTypes.map((type) => THUMBNAIL_TYPE_MAP[type])
                : [ThumbnailType.Type1];
            const key = storeKeyOf(item);

            await Promise.all(thumbnailTypes.map((type) => ensureThumbnailResolved(drive, item, key, type)));

            return get().thumbnails.get(key);
        },

        getThumbnailBytes: async (drive, item) => {
            const publicTypes = item.thumbnailTypes ?? ['sd'];
            const key = storeKeyOf(item);

            for (const publicType of publicTypes) {
                const type = THUMBNAIL_TYPE_MAP[publicType];
                const { urlKey } = THUMBNAIL_KEY_MAP[type];

                const freshBytes = await ensureThumbnailResolved(drive, item, key, type);
                if (freshBytes) {
                    return freshBytes;
                }

                // Resolved by someone else (already loaded, or another caller's in-flight fetch we
                // just waited on), read the resulting blob url back into bytes, a local, in-memory
                // read rather than a network round-trip.
                const url = get().thumbnails.get(key)?.[urlKey];
                if (url) {
                    logger.debug(`Thumbnail loaded: ${key} (type: ${type})`);
                    const response = await fetch(url);
                    return new Uint8Array(await response.arrayBuffer());
                }
            }

            return undefined;
        },
    };
});
