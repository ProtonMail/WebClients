import { createStore, del, get as getStore, set as setStore } from 'idb-keyval';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { isDevOrBlack } from '@proton/utils/env';

import { sendErrorReport } from '../../utils/errorHandling';
import { getLastActivePersistedUserSession } from '../../utils/lastActivePersistedUserSession';

interface ThumbnailMetadata {
    queue: string[];
    totalSize: number;
}

interface ThumbnailCacheState {
    thumbnailIds: string[];
    addThumbnail: (id: string, data: Uint8Array<ArrayBuffer>) => Promise<void>;
    getThumbnail: (id: string) => Promise<Uint8Array<ArrayBuffer> | undefined>;
}

const thumbnailStore = createStore('thumbnail-encrypted-cache-db', 'thumbnail-data');
const metaStore = createStore('thumbnail-encrypted-cache-meta', 'thumbnail-meta');

const MAX_ENTRIES = 500;
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const META_KEY = 'thumbnail-encrypted-cache-metadata';

const getMetadata = async (): Promise<ThumbnailMetadata> => {
    try {
        const meta = await getStore(META_KEY, metaStore);
        return meta || { queue: [], totalSize: 0 };
    } catch (e) {
        console.error('Failed to get thumbnail metadata:', e);
        sendErrorReport(e, {
            level: 'info',
        });
        return { queue: [], totalSize: 0 };
    }
};

const saveMetadata = async (metadata: ThumbnailMetadata): Promise<void> => {
    try {
        await setStore(META_KEY, metadata, metaStore);
    } catch (e) {
        console.error('Failed to save thumbnail metadata:', e);
        sendErrorReport(e, {
            level: 'info',
        });
    }
};

// Enforce storage limits by removing oldest entries if it's above the limits defined
// This is FIFO
const enforceStorageLimits = async (metadata: ThumbnailMetadata): Promise<void> => {
    const meta = { ...metadata };

    while (meta.queue.length > MAX_ENTRIES) {
        const oldestId = meta.queue.shift();
        if (!oldestId) {
            break;
        }

        try {
            const thumbnail = await getStore(oldestId, thumbnailStore);
            if (thumbnail) {
                meta.totalSize -= thumbnail.byteLength;
                await del(oldestId, thumbnailStore);
            }
        } catch (e) {
            console.error(`Failed to remove oldest thumbnail '${oldestId}':`, e);
            sendErrorReport(e);
        }
    }

    while (meta.totalSize > MAX_SIZE_BYTES && meta.queue.length > 0) {
        const oldestId = meta.queue.shift();
        if (!oldestId) {
            break;
        }

        try {
            const thumbnail = await getStore<Uint8Array<ArrayBuffer>>(oldestId, thumbnailStore);
            if (thumbnail) {
                meta.totalSize -= thumbnail.byteLength;
                await del(oldestId, thumbnailStore);
            }
        } catch (e) {
            console.error(`Failed to remove oldest thumbnail '${oldestId}':`, e);
            sendErrorReport(e);
        }
    }

    await saveMetadata(meta);
};

// For devs who go on fresh environments
// this avoids collision between users with same linkIds
const devOrBlack = isDevOrBlack();
export const getCacheKey = (linkId: string, shareId: string, revisionId: string = '') => {
    const prefix = devOrBlack ? getLastActivePersistedUserSession()?.UID || '' : '';
    return prefix + linkId + shareId + revisionId;
};

export const useThumbnailCacheStore = create<ThumbnailCacheState>()(
    devtools(
        (set) => ({
            thumbnailIds: [],

            addThumbnail: async (id: string, data: Uint8Array<ArrayBuffer>) => {
                try {
                    const meta = await getMetadata();

                    const existingIndex = meta.queue.indexOf(id);
                    if (existingIndex !== -1) {
                        const existingThumbnail = await getStore(id, thumbnailStore);
                        if (existingThumbnail) {
                            meta.totalSize -= existingThumbnail.byteLength;
                        }

                        meta.queue.splice(existingIndex, 1);
                    }

                    meta.queue.push(id);
                    meta.totalSize += data.byteLength;

                    await setStore(id, data, thumbnailStore);

                    await enforceStorageLimits(meta);

                    const updatedMeta = await getMetadata();

                    set({ thumbnailIds: updatedMeta.queue });
                } catch (e) {
                    console.error(`Failed to add thumbnail '${id}':`, e);
                    sendErrorReport(e);
                }
            },

            getThumbnail: async (id: string): Promise<Uint8Array<ArrayBuffer> | undefined> => {
                try {
                    const result = await getStore<Uint8Array<ArrayBuffer>>(id, thumbnailStore);
                    return result;
                } catch (e) {
                    console.error(`Failed to get thumbnail '${id}':`, e);
                    sendErrorReport(e);
                    return undefined;
                }
            },
        }),
        { name: 'ThumbnailCacheStore' }
    )
);
