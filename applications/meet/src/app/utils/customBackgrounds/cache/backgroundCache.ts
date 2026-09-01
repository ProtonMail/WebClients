import { isGuestBackgroundNamespace } from '@proton/meet/utils/customBackgrounds';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { BackgroundRecord, CachedBackground } from '../types';
import { BackgroundCacheDb } from './backgroundCacheDb';
import type { BackgroundCipher } from './crypto';
import { createGuestCipher, createUserKeyCipher } from './crypto';

/**
 * The read path for custom backgrounds: the cache paints the picker offline, on a cold start, and as
 * the only path a guest has, with Drive reconciling it afterwards.
 *
 * Until initialised, and after any failure, it is a transparent no-op — reads come back empty and
 * writes are dropped, degrading to fetching from Drive every time.
 */

interface ReadyCache {
    db: BackgroundCacheDb;
    cipher: BackgroundCipher;
    namespace: string;
}

interface InitParams {
    namespace: string;
    userKeys?: DecryptedKey[];
}

interface CacheSession {
    params: InitParams;
    cache?: ReadyCache;
    failed?: boolean;
}

let session: CacheSession | undefined;
let initPromise: Promise<void> | undefined;

const reportCacheError = (error: unknown) =>
    captureMessage('Meet custom background cache failure', {
        level: 'error',
        extra: { error },
        tags: { component: 'meet-background-cache' },
    });

/** A full disk is a cache miss, not a bug, so it is not reported as an error. */
const reportQuotaOrError = (error: unknown) => {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        captureMessage('Meet custom background cache: storage quota exceeded', { level: 'debug' });

        return;
    }

    reportCacheError(error);
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const isCurrent = ({ namespace, userKeys }: InitParams) =>
    session?.params.namespace === namespace && session.params.userKeys === userKeys;

/**
 * Reinitialised whenever the inputs change or a previous attempt left no usable cache: the cipher holds
 * key references the account clears as soon as a new set lands, and a failed open is worth retrying
 * rather than disabling the cache for the session.
 */
export const initBackgroundCache = (params: InitParams): Promise<void> => {
    // An open still in flight is awaited rather than repeated, which would leak the first connection.
    if (initPromise && isCurrent(params) && !session?.failed) {
        return initPromise;
    }

    // No IndexedDB (private mode, locked-down webview): leave the cache disabled silently.
    if (typeof indexedDB === 'undefined') {
        session = { params };
        initPromise = Promise.resolve();

        return initPromise;
    }

    const previous = session?.cache;
    const started: CacheSession = { params };

    session = started;
    initPromise = (async () => {
        try {
            previous?.db.close();

            const cipher = isGuestBackgroundNamespace(params.namespace)
                ? await createGuestCipher()
                : createUserKeyCipher(params.userKeys ?? []);
            const db = await BackgroundCacheDb.open();

            // A newer initialisation overtook this one while the database was opening.
            if (session !== started) {
                db.close();

                return;
            }

            started.cache = { db, cipher, namespace: params.namespace };
        } catch (error) {
            reportCacheError(error);
            started.failed = true;
        }
    })();

    return initPromise;
};

export const isBackgroundCacheReady = () => !!session?.cache;

const withCache = async <T>(
    fallback: T,
    run: (cache: ReadyCache) => Promise<T>,
    report: (error: unknown) => void = reportCacheError
): Promise<T> => {
    const cache = session?.cache;

    if (!cache) {
        return fallback;
    }

    try {
        return await run(cache);
    } catch (error) {
        report(error);

        return fallback;
    }
};

const withDb = async (run: (db: BackgroundCacheDb) => Promise<void>): Promise<void> => {
    if (typeof indexedDB === 'undefined') {
        return;
    }

    try {
        const existing = session?.cache?.db;
        const db = existing ?? (await BackgroundCacheDb.open());

        try {
            await run(db);
        } finally {
            if (!existing) {
                db.close();
            }
        }
    } catch (error) {
        reportCacheError(error);
    }
};

const decryptRecord = async (cache: ReadyCache, record: BackgroundRecord): Promise<CachedBackground> => {
    const name = textDecoder.decode(await cache.cipher.decryptField('metadata', record.id, record.metadata));
    const preview = record.preview ? await cache.cipher.decryptField('preview', record.id, record.preview) : undefined;

    return { id: record.id, revisionUid: record.revisionUid, createdAt: record.createdAt, name, preview };
};

/** A record that opens under none of the user's keys is dropped and refetched during reconciliation. */
export const listCachedBackgrounds = (): Promise<CachedBackground[]> =>
    withCache<CachedBackground[]>([], async (cache) => {
        const records = await cache.db.listRecords(cache.namespace);
        const backgrounds: CachedBackground[] = [];

        for (const record of records) {
            try {
                backgrounds.push(await decryptRecord(cache, record));
            } catch {
                await cache.db.deleteRecord(cache.namespace, record.id).catch(() => undefined);
            }
        }

        return backgrounds;
    });

/** Reports whether the record landed, so a caller can fall back rather than read back nothing. */
export const putCachedBackground = ({
    name,
    image,
    ...background
}: CachedBackground & { image?: Uint8Array<ArrayBuffer> }): Promise<boolean> =>
    withCache(
        false,
        async (cache) => {
            const { id, preview } = background;

            await cache.db.putRecord({
                ...background,
                namespace: cache.namespace,
                metadata: await cache.cipher.encryptField('metadata', id, textEncoder.encode(name)),
                preview: preview ? await cache.cipher.encryptField('preview', id, preview) : undefined,
                image: image ? await cache.cipher.encryptField('image', id, image) : undefined,
            });

            return true;
        },
        reportQuotaOrError
    );

/** Adds full-resolution bytes to a record that was cached from a listing with only its thumbnail. */
export const attachCachedBackgroundImage = (id: string, image: Uint8Array<ArrayBuffer>): Promise<void> =>
    withCache<void>(
        undefined,
        async (cache) => {
            const record = await cache.db.getRecord(cache.namespace, id);

            if (!record) {
                return;
            }

            await cache.db.putRecord({ ...record, image: await cache.cipher.encryptField('image', id, image) });
        },
        reportQuotaOrError
    );

export const getCachedBackgroundImage = (id: string): Promise<Uint8Array<ArrayBuffer> | undefined> =>
    withCache<Uint8Array<ArrayBuffer> | undefined>(undefined, async (cache) => {
        const record = await cache.db.getRecord(cache.namespace, id);

        if (!record?.image) {
            return undefined;
        }

        const image = await cache.cipher.decryptField('image', id, record.image);
        await cache.db.touchImage(cache.namespace, id);

        return image;
    });

export const deleteCachedBackground = (id: string): Promise<void> =>
    withCache<void>(undefined, (cache) => cache.db.deleteRecord(cache.namespace, id));

export const purgeBackgroundNamespace = (namespace: string): Promise<void> =>
    withDb((db) => db.deleteNamespace(namespace));

/** Catches namespaces whose session was removed while Meet was closed, so logout never purged them. */
export const pruneOrphanBackgroundNamespaces = (liveNamespaces: string[]): Promise<void> =>
    withDb(async (db) => {
        for (const namespace of await db.listNamespaces()) {
            if (!liveNamespaces.includes(namespace)) {
                await db.deleteNamespace(namespace);
            }
        }
    });
