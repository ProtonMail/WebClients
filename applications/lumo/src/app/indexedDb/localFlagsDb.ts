import { computeSha256AsBase64 } from '../crypto';
import type { ConversationId } from '../types';
import { getIndexedDB, requestToPromise } from './util';

/**
 * Device-local flags that never sync to the server.
 *
 * Kept in its own database rather than as a LumoDB store: adding a store to LumoDB means bumping its
 * version, and `handleIndexedDBVersionDowngrade` deletes LumoDB (including unsynced messages) when an
 * older client opens it after a rollback. An older client never opens this database at all.
 *
 * Holds conversation ids only, no content, so it isn't encrypted.
 */
const DB_BASE_NAME = 'LumoLocalFlags';
const DB_NAME_SALT = 'Qm3vLx8tR2pWc7nZ4kHs9dYf6gJb1eTa';
const DB_VERSION = 1;
const MESSAGE_LIMIT_REACHED_STORE = 'message_limit_reached_v1';

interface MessageLimitReachedEntry {
    conversationId: ConversationId;
    reachedAt: number;
}

export class LocalFlagsDb {
    private db: Promise<IDBDatabase> | undefined;

    constructor(private readonly userId: string | undefined) {}

    private getDb = (): Promise<IDBDatabase> => {
        this.db ??= this.openDb().catch((error) => {
            this.db = undefined;
            throw error;
        });
        return this.db;
    };

    private openDb = async (): Promise<IDBDatabase> => {
        const idb = getIndexedDB();
        const userHash = this.userId ? await computeSha256AsBase64(`${this.userId}:${DB_NAME_SALT}`) : undefined;
        const dbName = userHash ? `${DB_BASE_NAME}_${userHash}` : DB_BASE_NAME;

        const request = idb.open(dbName, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(MESSAGE_LIMIT_REACHED_STORE)) {
                db.createObjectStore(MESSAGE_LIMIT_REACHED_STORE, { keyPath: 'conversationId' });
            }
        };
        const db = await requestToPromise(request);
        db.onversionchange = () => {
            db.close();
            this.db = undefined;
        };
        return db;
    };

    private getStore = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
        const db = await this.getDb();
        return db.transaction(MESSAGE_LIMIT_REACHED_STORE, mode).objectStore(MESSAGE_LIMIT_REACHED_STORE);
    };

    public getMessageLimitReachedConversationIds = async (): Promise<ConversationId[]> => {
        const store = await this.getStore('readonly');
        const keys = await requestToPromise(store.getAllKeys());
        return keys.filter((key): key is ConversationId => typeof key === 'string');
    };

    public markMessageLimitReached = async (conversationId: ConversationId): Promise<void> => {
        const store = await this.getStore('readwrite');
        const entry: MessageLimitReachedEntry = { conversationId, reachedAt: Date.now() };
        await requestToPromise(store.put(entry));
    };

    public clearMessageLimitReached = async (conversationId: ConversationId): Promise<void> => {
        const store = await this.getStore('readwrite');
        await requestToPromise(store.delete(conversationId));
    };

    public clearAllMessageLimitReached = async (): Promise<void> => {
        const store = await this.getStore('readwrite');
        await requestToPromise(store.clear());
    };
}
