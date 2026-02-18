import isEqual from 'lodash/isEqual';

import { computeSha256AsBase64 } from '../crypto';
import { handleIndexedDBVersionDowngrade } from '../helpers/indexedDBVersionHandler';
import type { IdMapEntry, LocalId, RemoteId, ResourceType } from '../remote/types';
import type { SerializedConversationMap, SerializedMessageMap, SerializedSpaceMap } from '../types';
import {
    type AttachmentId,
    type ConversationId,
    type MessageId,
    type SerializedAttachment,
    type SerializedAttachmentMap,
    type SerializedConversation,
    type SerializedMessage,
    type SerializedSpace,
    type SpaceId,
    cleanSerializedAttachment,
    cleanSerializedConversation,
    cleanSerializedMessage,
    cleanSerializedSpace,
} from '../types';
import { mapify } from '../util/collections';
import { isNonNullable } from '../util/nullable';
import { requestToPromise, withCursor } from './util';

// Type aliases for backwards compatibility (assets are now attachments)
type AssetId = AttachmentId;
type SerializedAsset = SerializedAttachment;
const cleanSerializedAsset = cleanSerializedAttachment;

export const SPACE_STORE = 'spaces_v4';
export const CONVERSATION_STORE = 'conversations_v4';
export const MESSAGE_STORE = 'messages_v4';
export const ATTACHMENT_STORE = 'attachments_v4';
export const ASSET_STORE = 'assets_v1';
export const REMOTE_ID_STORE = 'remote_ids_v4';
export const FOUNDATION_SEARCH_STORE = 'foundation_search_v1';

export const DB_BASE_NAME = 'LumoDB';
export const DB_NAME_SALT = 'AT8hqCBf9sDXLeCNXbaWXD769XdpPDfk';

export enum SpaceStoreFields {
    Id = 'id',
}

export enum ConversationStoreFields {
    Id = 'id',
    SpaceId = 'spaceId',
}

export enum MessageStoreFields {
    Id = 'id',
    ConversationId = 'conversationId',
}

export enum AttachmentStoreFields {
    Id = 'id',
    SpaceId = 'spaceId',
}

export enum FoundationSearchStoreFields {
    BlobName = 'blobName',
    BlobData = 'blobData',
    LastUpdated = 'lastUpdated',
}

export enum RemoteIdStoreFields {
    Type = 'type',
    RemoteId = 'remoteId',
    LocalId = 'localId',
}

export enum ConversationStoreIndexes {
    SpaceId = 'idx_spaceId',
}

export enum MessageStoreIndexes {
    ConversationId = 'idx_conversationId',
}

export enum AttachmentStoreIndexes {
    SpaceId = 'idx_spaceId',
}

export enum AssetStoreIndexes {
    SpaceId = 'idx_spaceId',
}

export enum RemoteIdStoreIndexes {
    TypeRemoteId = 'idx_type_remoteId',
}

// Store configuration types
interface StoreConfig<T> {
    storeName: string;
    keyPath: keyof T;
    type: ResourceType;
    indexes?: {
        name: string;
        keyPath: keyof T;
        options?: IDBIndexParameters;
    }[];
    cleanFunction: (data: T) => T;
}

// Base interface for all resources
interface BaseResource {
    id: string;
    dirty?: boolean;
}

// Generic store operations
class StoreOperations<T extends BaseResource> {
    constructor(
        private db: Promise<IDBDatabase>,
        private readonly config: StoreConfig<T>
    ) {}

    private wrapError(error: any, operation: string): Error {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const wrappedError = new Error(`${operation} failed: ${errorMessage}`);
        (wrappedError as any).originalError = error;
        (wrappedError as any).name = error?.name || 'Error';
        return wrappedError;
    }

    async add(object: T, { dirty }: { dirty: boolean }, tx?: IDBTransaction): Promise<void> {
        try {
            tx ??= await this.getTransaction('readwrite');
            const store = tx.objectStore(this.config.storeName);
            console.log(`Adding ${this.config.type} ${object.id}`);

            const cleanedObject = this.config.cleanFunction({ ...object, dirty });

            return await new Promise<void>((resolve, reject) => {
                const request = store.add(cleanedObject);
                request.onsuccess = () => {
                    console.log(`${this.config.type} ${object.id} added successfully on IDB!`);
                    resolve();
                };
                request.onerror = () => {
                    if (request.error?.name === 'ConstraintError') {
                        console.log(`Adding ${this.config.type} ${object.id} but it already exists, ignoring`);
                        resolve();
                    } else {
                        console.error(`Error adding ${this.config.type}: ${request.error?.toString()}`);
                        reject(this.wrapError(request.error, `add ${this.config.type}`));
                    }
                };
            });
        } catch (error) {
            throw this.wrapError(error, `add ${this.config.type}`);
        }
    }

    async update(object: T, { dirty }: { dirty: boolean }, tx?: IDBTransaction): Promise<void> {
        try {
            tx ??= await this.getTransaction('readwrite');
            const store = tx.objectStore(this.config.storeName);
            console.log(`Updating ${this.config.type} ${object.id}`);

            const cleanedObject = this.config.cleanFunction({ ...object, dirty });

            return await new Promise<void>((resolve, reject) => {
                const request = store.put(cleanedObject);
                request.onsuccess = () => {
                    console.log(`${this.config.type} ${object.id} updated successfully on IDB!`, object);
                    resolve();
                };
                request.onerror = () => {
                    console.error(`Error updating ${this.config.type}: ${request.error?.toString()}`);
                    reject(this.wrapError(request.error, `update ${this.config.type}`));
                };
            });
        } catch (error) {
            throw this.wrapError(error, `update ${this.config.type}`);
        }
    }

    async getById(id: string, tx?: IDBTransaction): Promise<T | undefined> {
        try {
            tx ??= await this.getTransaction('readonly');
            const store = tx.objectStore(this.config.storeName);

            return await new Promise<T | undefined>((resolve, reject) => {
                const request = store.get(id) as IDBRequest<T>;
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(this.config.cleanFunction(request.result));
                    } else {
                        resolve(undefined);
                    }
                };
                request.onerror = () => {
                    console.error(`Error retrieving item: ${request.error?.toString()}`);
                    reject(this.wrapError(request.error, `getById ${this.config.type}`));
                };
            });
        } catch (error) {
            throw this.wrapError(error, `getById ${this.config.type}`);
        }
    }

    async getAll(tx?: IDBTransaction): Promise<T[]> {
        try {
            tx ??= await this.getTransaction('readonly');
            const store = tx.objectStore(this.config.storeName);

            return await new Promise<T[]>((resolve, reject) => {
                const request = store.getAll() as IDBRequest<T[]>;
                request.onsuccess = () => {
                    resolve(request.result.map(this.config.cleanFunction));
                };
                request.onerror = () => {
                    console.error(`Error retrieving all items: ${request.error?.toString()}`);
                    reject(this.wrapError(request.error, `getAll ${this.config.type}`));
                };
            });
        } catch (error) {
            throw this.wrapError(error, `getAll ${this.config.type}`);
        }
    }

    async delete(id: string, tx?: IDBTransaction): Promise<void> {
        try {
            tx ??= await this.getTransaction('readwrite');
            const store = tx.objectStore(this.config.storeName);
            console.log(`Deleting ${this.config.type} ${id}`);

            return await new Promise<void>((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => {
                    console.log(`${this.config.type} ${id} deleted successfully!`);
                    resolve();
                };
                request.onerror = () => {
                    console.error(`Error deleting item: ${request.error?.toString()}`);
                    reject(this.wrapError(request.error, `delete ${this.config.type}`));
                };
            });
        } catch (error) {
            throw this.wrapError(error, `delete ${this.config.type}`);
        }
    }

    async getByIndex(indexName: string, value: any, tx?: IDBTransaction): Promise<T[]> {
        tx ??= await this.getTransaction('readonly');
        const store = tx.objectStore(this.config.storeName);
        const index = store.index(indexName);

        return new Promise<T[]>((resolve, reject) => {
            const request = index.getAll(value) as IDBRequest<T[]>;
            request.onsuccess = () => {
                resolve(request.result.map(this.config.cleanFunction));
            };
            request.onerror = () => {
                console.error(`Error retrieving items by index: ${request.error?.toString()}`);
                reject();
            };
        });
    }

    async deleteByIndex(indexName: string, value: any, tx?: IDBTransaction): Promise<void> {
        tx ??= await this.getTransaction('readwrite');
        const store = tx.objectStore(this.config.storeName);
        const index = store.index(indexName);

        console.log(`Deleting ${this.config.type} items with ${indexName}=${value}`);

        return withCursor(index, async (cursor: IDBCursorWithValue) => {
            if (cursor.key === value) {
                await requestToPromise(cursor.delete());
                console.log(`Deleted ${this.config.type} item ${cursor.value.id}`);
            }
        }).then(() => {
            console.log(`All ${this.config.type} items with ${indexName}=${value} deleted successfully!`);
        });
    }

    async getMultiple(ids: string[], tx?: IDBTransaction): Promise<T[]> {
        tx ??= await this.getTransaction('readonly');
        const store = tx.objectStore(this.config.storeName);

        const results = await Promise.all(
            ids.map(
                (id) =>
                    new Promise<T | undefined>((resolve, reject) => {
                        const request = store.get(id) as IDBRequest<T>;
                        request.onsuccess = () => {
                            if (request.result) {
                                resolve(this.config.cleanFunction(request.result));
                            } else {
                                resolve(undefined);
                            }
                        };
                        request.onerror = () => {
                            console.error(`Error retrieving item: ${request.error?.toString()}`);
                            reject();
                        };
                    })
            )
        );

        return results.filter(isNonNullable);
    }

    private async getTransaction(mode: IDBTransactionMode): Promise<IDBTransaction> {
        return (await this.db).transaction(this.config.storeName, mode);
    }

    async markAsSynced1(snapshot: T, resourceType: ResourceType, tx?: IDBTransaction): Promise<boolean> {
        tx ??= await this.getTransaction('readwrite');
        const id = snapshot.id;

        console.log(`Marking ${resourceType} ${id} as synced`);

        const objectInDb = await this.getById(id, tx);
        if (!objectInDb) {
            throw new Error(`Error while marking ${resourceType} as synced: ${id} does not exist in db`);
        }

        // Compare the objects without the dirty flag
        const { dirty: _dirty1, ...cleanSnapshot } = snapshot;
        const { dirty: _dirty2, ...cleanInDb } = objectInDb;
        const hasChanged = !isEqual(cleanSnapshot, cleanInDb);

        if (hasChanged) {
            console.log(`${resourceType} ${id} has changed while we were persisting it remotely. Will try again soon`);
            return false;
        }

        const store = tx.objectStore(this.config.storeName);

        try {
            await requestToPromise(store.put(cleanInDb));
            console.log(`Marked ${resourceType} ${id} as synced`);
            return true;
        } catch (e) {
            console.error(`Error while marking ${resourceType} ${id} as synced:`, e);
            return false;
        }
    }

    async markAsSynced(snapshot: T, resourceType: ResourceType, tx?: IDBTransaction): Promise<boolean> {
        const id = snapshot.id;
        console.log(`Marking ${resourceType} ${id} as synced`);
        if (!tx) tx = await this.getTransaction('readwrite');
        return this.getById(id, tx)
            .then((objectInDb) => ({ tx, objectInDb }))
            .then(({ tx, objectInDb }): Promise<boolean> => {
                if (!objectInDb) {
                    throw new Error(`Error while marking ${resourceType} as synced: ${id} does not exist in db`);
                }

                // Compare the objects without the dirty flag
                const { dirty: _dirty1, ...cleanSnapshot } = snapshot;
                const { dirty: _dirty2, ...cleanInDb } = objectInDb;
                const hasChanged = !isEqual(cleanSnapshot, cleanInDb);

                if (hasChanged) {
                    console.log(
                        `${resourceType} ${id} has changed while we were persisting it remotely. Will try again soon`
                    );
                    return Promise.resolve(false);
                }

                const store = tx.objectStore(this.config.storeName);

                return requestToPromise(store.put(cleanInDb))
                    .then(() => {
                        console.log(`Marked ${resourceType} ${id} as synced`);
                        return true;
                    })
                    .catch((e) => {
                        console.error(`Error while marking ${resourceType} ${id} as synced:`, e);
                        return false;
                    });
            });
    }
}

// Store configurations
const storeConfigs = {
    space: {
        storeName: SPACE_STORE,
        keyPath: SpaceStoreFields.Id,
        type: 'space' satisfies ResourceType,
        cleanFunction: cleanSerializedSpace,
    } satisfies StoreConfig<SerializedSpace>,

    conversation: {
        storeName: CONVERSATION_STORE,
        keyPath: ConversationStoreFields.Id,
        type: 'conversation' satisfies ResourceType,
        indexes: [
            {
                name: ConversationStoreIndexes.SpaceId,
                keyPath: ConversationStoreFields.SpaceId,
            },
        ],
        cleanFunction: cleanSerializedConversation,
    } satisfies StoreConfig<SerializedConversation>,

    message: {
        storeName: MESSAGE_STORE,
        keyPath: MessageStoreFields.Id,
        type: 'message' satisfies ResourceType,
        indexes: [
            {
                name: MessageStoreIndexes.ConversationId,
                keyPath: MessageStoreFields.ConversationId,
            },
        ],
        cleanFunction: cleanSerializedMessage,
    } satisfies StoreConfig<SerializedMessage>,

    attachment: {
        storeName: ATTACHMENT_STORE,
        keyPath: AttachmentStoreFields.Id,
        type: 'attachment' satisfies ResourceType,
        indexes: [
            {
                name: AttachmentStoreIndexes.SpaceId,
                keyPath: AttachmentStoreFields.SpaceId,
            },
        ],
        cleanFunction: cleanSerializedAttachment,
    } satisfies StoreConfig<SerializedAttachment>,

    asset: {
        storeName: ASSET_STORE,
        keyPath: AttachmentStoreFields.Id, // Assets use same ID structure
        type: 'asset' satisfies ResourceType,
        indexes: [
            {
                name: AssetStoreIndexes.SpaceId,
                keyPath: AttachmentStoreFields.SpaceId,
            },
        ],
        cleanFunction: cleanSerializedAsset,
    } satisfies StoreConfig<SerializedAsset>,
};

export type UnsyncedMaps = {
    unsyncedMessages: SerializedMessageMap;
    unsyncedConversations: SerializedConversationMap;
    unsyncedSpaces: SerializedSpaceMap;
    unsyncedAttachments: SerializedAttachmentMap;
};

export class DbApi {
    private db: Promise<IDBDatabase>;
    private readonly spaceStore: StoreOperations<SerializedSpace>;
    private readonly conversationStore: StoreOperations<SerializedConversation>;
    private readonly messageStore: StoreOperations<SerializedMessage>;
    private readonly attachmentStore: StoreOperations<SerializedAttachment>;
    private readonly assetStore: StoreOperations<SerializedAsset>;
    private readonly userId: string | undefined;
    private isReconnecting = false;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly baseReconnectDelay = 1000; // 1 second

    constructor(userId: string | undefined) {
        this.userId = userId;
        this.db = this.openDb(userId);
        this.setupConnectionMonitoring();

        // Initialize store operations
        this.spaceStore = new StoreOperations(this.db, storeConfigs.space);
        this.conversationStore = new StoreOperations(this.db, storeConfigs.conversation);
        this.messageStore = new StoreOperations(this.db, storeConfigs.message);
        this.attachmentStore = new StoreOperations(this.db, storeConfigs.attachment);
        this.assetStore = new StoreOperations(this.db, storeConfigs.asset);
    }

    private setupConnectionMonitoring = async () => {
        try {
            const database = await this.db;

            // Monitor for unexpected database closure
            database.onclose = () => {
                console.warn('[LumoDB] Database connection closed unexpectedly. Attempting to reconnect...');
                this.handleConnectionLoss();
            };

            // Monitor for version changes from other tabs
            database.onversionchange = () => {
                console.warn('[LumoDB] Database version changed by another tab. Closing connection...');
                database.close();
                this.handleConnectionLoss();
            };
        } catch (error) {
            console.error('[LumoDB] Failed to setup connection monitoring:', error);
            // If initial connection fails, try to reconnect
            this.handleConnectionLoss();
        }
    };

    private handleConnectionLoss = async () => {
        if (this.isReconnecting) {
            console.log('[LumoDB] Reconnection already in progress, skipping...');
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.error('[LumoDB] Max reconnection attempts reached. Please refresh the page.');
            this.isReconnecting = false;
            // Optionally dispatch an event or show a notification to the user
            window.dispatchEvent(new CustomEvent('indexeddb-connection-failed', {
                detail: { message: 'Connection to database lost. Please refresh the page.' }
            }));
            return;
        }

        // Calculate exponential backoff delay
        const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`[LumoDB] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            // Create a new database connection
            this.db = this.openDb(this.userId);
            await this.setupConnectionMonitoring();

            // Update store operations with new connection
            this.updateStoreConnections();

            console.log('[LumoDB] Successfully reconnected to database');
            this.reconnectAttempts = 0;
            this.isReconnecting = false;

            // Dispatch success event
            window.dispatchEvent(new CustomEvent('indexeddb-reconnected', {
                detail: { message: 'Database connection restored' }
            }));
        } catch (error) {
            console.error('[LumoDB] Reconnection attempt failed:', error);
            this.isReconnecting = false;
            // Try again
            this.handleConnectionLoss();
        }
    };

    private updateStoreConnections = () => {
        // Update the db reference in all store operations
        (this.spaceStore as any).db = this.db;
        (this.conversationStore as any).db = this.db;
        (this.messageStore as any).db = this.db;
        (this.attachmentStore as any).db = this.db;
        (this.assetStore as any).db = this.db;
    };

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        maxRetries = 3
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                const errorMessage = error?.message || error?.toString() || '';
                const isConnectionError =
                    errorMessage.includes('Connection to Indexed Database') ||
                    errorMessage.includes('UnknownError') ||
                    error?.name === 'UnknownError';

                if (isConnectionError && attempt < maxRetries) {
                    console.warn(`[LumoDB] ${operationName} failed with connection error (attempt ${attempt}/${maxRetries}). Retrying...`);

                    // Trigger reconnection if not already in progress
                    if (!this.isReconnecting) {
                        this.handleConnectionLoss();
                    }

                    // Wait for reconnection with timeout
                    const reconnectTimeout = 5000 * attempt; // Increasing timeout per attempt
                    await this.waitForReconnection(reconnectTimeout);
                } else {
                    // Non-connection error or max retries reached
                    throw error;
                }
            }
        }

        throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
    }

    private async waitForReconnection(timeout: number): Promise<void> {
        const startTime = Date.now();

        while (this.isReconnecting && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.isReconnecting) {
            throw new Error('Reconnection timeout');
        }
    }

    public newTransaction = async (storeName: string | string[], mode?: IDBTransactionMode) => {
        return this.executeWithRetry(
            async () => (await this.db).transaction(storeName, mode ?? 'readwrite'),
            'newTransaction'
        );
    };

    // Message operations
    public addMessage = async (message: SerializedMessage, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.messageStore.add(message, { dirty }, tx),
            'addMessage'
        );
    };

    public updateMessage = async (message: SerializedMessage, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.messageStore.update(message, { dirty }, tx),
            'updateMessage'
        );
    };

    public getMessageById = async (id: MessageId, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.messageStore.getById(id, tx),
            'getMessageById'
        );
    };

    // Conversation operations
    public addConversation = async (
        conversation: SerializedConversation,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.executeWithRetry(
            () => this.conversationStore.add(conversation, { dirty }, tx),
            'addConversation'
        );
    };

    public updateConversation = async (
        conversation: SerializedConversation,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.executeWithRetry(
            () => this.conversationStore.update(conversation, { dirty }, tx),
            'updateConversation'
        );
    };

    public getConversationById = async (id: ConversationId, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.conversationStore.getById(id, tx),
            'getConversationById'
        );
    };

    // Space operations
    public addSpace = async (space: SerializedSpace, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.spaceStore.add(space, { dirty }, tx),
            'addSpace'
        );
    };

    public updateSpace = async (space: SerializedSpace, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.spaceStore.update(space, { dirty }, tx),
            'updateSpace'
        );
    };

    public getSpaceById = async (id: SpaceId, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.spaceStore.getById(id, tx),
            'getSpaceById'
        );
    };

    public deleteSpace = async (id: SpaceId, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.spaceStore.delete(id, tx),
            'deleteSpace'
        );
    };

    // Attachment operations
    public addAttachment = async (
        attachment: SerializedAttachment,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.executeWithRetry(
            () => this.attachmentStore.add(attachment, { dirty }, tx),
            'addAttachment'
        );
    };

    public updateAttachment = async (
        attachment: SerializedAttachment,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.executeWithRetry(
            () => this.attachmentStore.update(attachment, { dirty }, tx),
            'updateAttachment'
        );
    };

    public getAttachmentById = async (id: AttachmentId, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.attachmentStore.getById(id, tx),
            'getAttachmentById'
        );
    };

    public deleteAttachment = async (id: AttachmentId, tx?: IDBTransaction) => {
        return this.executeWithRetry(
            () => this.attachmentStore.delete(id, tx),
            'deleteAttachment'
        );
    };

    // Asset operations
    public addAsset = async (asset: SerializedAsset, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.assetStore.add(asset, { dirty }, tx);
    };

    public updateAsset = async (asset: SerializedAsset, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.assetStore.update(asset, { dirty }, tx);
    };

    public getAssetById = async (id: AssetId, tx?: IDBTransaction) => {
        return this.assetStore.getById(id, tx);
    };

    public softDeleteAsset = async (id: AssetId, { dirty }: { dirty: boolean }, tx?: IDBTransaction): Promise<void> => {
        tx ??= (await this.db).transaction(ASSET_STORE, 'readwrite');
        const asset = await this.getAssetById(id, tx);
        // If asset doesn't exist in IDB, it's already deleted or was never persisted - noop
        if (!asset) {
            console.log(`Asset ${id} not found in IDB, skipping soft delete`);
            return;
        }

        // If already deleted, noop
        if (asset.deleted === true) {
            console.log(`Asset ${id} already marked as deleted, skipping soft delete`);
            return;
        }

        // Keep only essential metadata from AssetPub and remove heavy fields
        const { id: assetId, spaceId, uploadedAt, mimeType, rawBytes } = asset;
        const updatedAsset = {
            id: assetId,
            spaceId,
            uploadedAt,
            mimeType,
            rawBytes,
            deleted: true,
        } as SerializedAsset;
        await this.updateAsset(updatedAsset, { dirty }, tx);
    };

    public deleteAsset = async (id: AssetId, tx?: IDBTransaction) => {
        return this.assetStore.delete(id, tx);
    };

    public getAllAssets = async (tx?: IDBTransaction): Promise<SerializedAsset[]> => {
        return this.assetStore.getAll(tx);
    };

    // Bulk operations
    public getAllSpaces = async (tx?: IDBTransaction): Promise<SerializedSpace[]> => {
        return this.executeWithRetry(
            () => this.spaceStore.getAll(tx),
            'getAllSpaces'
        );
    };

    public getAllConversations = async (tx?: IDBTransaction): Promise<SerializedConversation[]> => {
        return this.executeWithRetry(
            () => this.conversationStore.getAll(tx),
            'getAllConversations'
        );
    };

    public getAllMessages = async (tx?: IDBTransaction): Promise<SerializedMessage[]> => {
        return this.executeWithRetry(
            () => this.messageStore.getAll(tx),
            'getAllMessages'
        );
    };

    public getAllAttachments = async (tx?: IDBTransaction): Promise<SerializedAttachment[]> => {
        return this.executeWithRetry(
            () => this.attachmentStore.getAll(tx),
            'getAllAttachments'
        );
    };

    public getAllIdMaps = async (tx?: IDBTransaction): Promise<IdMapEntry[]> => {
        tx ??= await this.newTransaction(REMOTE_ID_STORE, 'readonly');
        const store = tx.objectStore(REMOTE_ID_STORE);

        return new Promise<IdMapEntry[]>((resolve, reject) => {
            const request = store.getAll() as IDBRequest<IdMapEntry[]>;
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                console.error(`Error retrieving all id maps: ${request.error?.toString()}`);
                reject();
            };
        });
    };

    public getMessagesByConversationId = async (conversationId: ConversationId, tx?: IDBTransaction) => {
        return this.messageStore.getByIndex(MessageStoreIndexes.ConversationId, conversationId, tx);
    };

    public getConversationsBySpaceId = async (spaceId: SpaceId, tx?: IDBTransaction) => {
        return this.conversationStore.getByIndex(ConversationStoreIndexes.SpaceId, spaceId, tx);
    };

    public getAttachmentsBySpaceId = async (spaceId: SpaceId, tx?: IDBTransaction) => {
        return this.attachmentStore.getByIndex(AttachmentStoreIndexes.SpaceId, spaceId, tx);
    };

    public deleteMessagesByConversationId = async (conversationId: string, tx?: IDBTransaction) => {
        return this.messageStore.deleteByIndex(MessageStoreIndexes.ConversationId, conversationId, tx);
    };

    public getAttachments = async (ids: AttachmentId[], tx?: IDBTransaction) => {
        return this.attachmentStore.getMultiple(ids, tx);
    };

    public deleteAllData = async (tx?: IDBTransaction) => {
        tx ??= (await this.db).transaction(
            [SPACE_STORE, CONVERSATION_STORE, MESSAGE_STORE, ATTACHMENT_STORE, REMOTE_ID_STORE],
            'readwrite'
        );

        return Promise.resolve()
            .then(() =>
                requestToPromise(tx.objectStore(MESSAGE_STORE).clear()).catch((e) => {
                    console.log(`cannot delete all messages: ${e}`);
                })
            )
            .then(() =>
                requestToPromise(tx.objectStore(CONVERSATION_STORE).clear()).catch((e) => {
                    console.log(`cannot delete all conversations: ${e}`);
                })
            )
            .then(() =>
                requestToPromise(tx.objectStore(ATTACHMENT_STORE).clear()).catch((e) => {
                    console.log(`cannot delete all attachments: ${e}`);
                })
            )
            .then(() =>
                requestToPromise(tx.objectStore(SPACE_STORE).clear()).catch((e) => {
                    console.log(`cannot delete all spaces: ${e}`);
                })
            )
            .then(() =>
                requestToPromise(tx.objectStore(REMOTE_ID_STORE).clear()).catch((e) => {
                    console.log(`cannot delete all id maps: ${e}`);
                })
            );
    };

    public softDeleteAllData = async ({ dirty }: { dirty: boolean }) => {
        const spaces = await this.getAllSpaces();
        return Promise.all(spaces.map((s) => this.softDeleteSpaceCascade(s.id, { dirty })));
    };

    public addRemoteId = async (entry: IdMapEntry, tx?: IDBTransaction) => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                console.log(`addRemoteId: `, entry);

                tx ??= (await this.db).transaction(REMOTE_ID_STORE, 'readwrite');
                const { type, localId, remoteId } = entry;

                // Check if localId already exists and maps to a different remoteId
                const existingRemoteId = await this.getRemoteIdFromLocalId(type, localId, tx);
                if (existingRemoteId) {
                    if (existingRemoteId === remoteId) {
                        // console.warn(`Remote ID mapping already exists and is the same for ${type} ${localId}`);
                        return resolve();
                    } else {
                        // prettier-ignore
                        return reject(
                            `Duplicate ID detected: ` +
                            `${type} localId ${localId} already points ` +
                            `to a different remoteId ${existingRemoteId}. ` +
                            `Ignoring.`
                        );
                    }
                }

                // Check if remoteId already exists and maps to a different localId
                const existingLocalId = await this.getLocalIdFromRemoteId(type, remoteId, tx);
                if (existingLocalId) {
                    if (existingLocalId === localId) {
                        // console.warn(`Local ID mapping already exists and is the same for ${type} ${remoteId}`);
                        return resolve();
                    } else {
                        // prettier-ignore
                        return reject(
                            `Duplicate ID detected: ` +
                            `${type} remoteId ${remoteId} already points ` +
                            `to a different localId ${existingLocalId}. ` +
                            `Ignoring.`
                        );
                    }
                }

                // Add the new entry if no conflicts are found or if warnings have been logged
                const store = tx.objectStore(REMOTE_ID_STORE);
                console.log(`Adding Remote ID mapping for ${type} ${localId} -> ${remoteId}`);
                const request = store.add(entry);
                request.onsuccess = () => {
                    console.log(`Remote ID mapping added successfully for ${type} ${localId} -> ${remoteId}`);
                    resolve();
                };
                request.onerror = () => {
                    if (request.error?.name === 'ConstraintError') {
                        console.warn(
                            `Remote ID mapping for ${type} ${localId} -> ${remoteId} already exists, ignoring`
                        );
                        resolve();
                    } else {
                        reject('Error adding remote ID mapping: ' + request.error?.toString());
                    }
                };
            } catch (error) {
                reject('Error: ' + error);
            }
        });
    };

    public getRemoteIdFromLocalId = async (
        type: ResourceType,
        localId: LocalId,
        tx?: IDBTransaction
    ): Promise<RemoteId | undefined> => {
        return new Promise(async (resolve, reject) => {
            try {
                tx ??= (await this.db).transaction(REMOTE_ID_STORE, 'readonly');
                const store = tx.objectStore(REMOTE_ID_STORE);
                const request = store.get([type, localId]) as IDBRequest<IdMapEntry>;

                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result.remoteId);
                    } else {
                        resolve(undefined);
                    }
                };

                request.onerror = () => {
                    reject('Error retrieving remote ID by local ID: ' + request.error?.toString());
                };
            } catch (error) {
                reject('Error: ' + error);
            }
        });
    };

    public getLocalIdFromRemoteId = (
        type: ResourceType,
        remoteId: RemoteId,
        tx?: IDBTransaction
    ): Promise<LocalId | undefined> => {
        return new Promise(async (resolve, reject) => {
            try {
                tx ??= (await this.db).transaction(REMOTE_ID_STORE, 'readonly');
                const store = tx.objectStore(REMOTE_ID_STORE);
                const index = store.index(RemoteIdStoreIndexes.TypeRemoteId);
                const request = index.get([type, remoteId]) as IDBRequest<IdMapEntry>;

                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result.localId);
                    } else {
                        resolve(undefined);
                    }
                };

                request.onerror = () => {
                    reject('Error retrieving local ID by remote ID: ' + request.error?.toString());
                };
            } catch (error) {
                reject('Error: ' + error);
            }
        });
    };

    public deleteOrphanMessages = async (tx?: IDBTransaction): Promise<void> => {
        tx ??= (await this.db).transaction([MESSAGE_STORE, CONVERSATION_STORE], 'readwrite');
        const messageStore = tx.objectStore(MESSAGE_STORE);
        const conversationStore = tx.objectStore(CONVERSATION_STORE);
        const index = messageStore.index(MessageStoreIndexes.ConversationId);

        return withCursor(index, async (cursor) => {
            const conversationId = cursor.value.conversationId as ConversationId;
            const conversation = await requestToPromise(conversationStore.get(conversationId));

            if (!conversation) {
                console.log(`Orphan message ${cursor.value.id} found, deleting locally`);
                await requestToPromise(messageStore.delete(cursor.value.id));
                console.log(`Deleted orphan message ${cursor.value.id}`);
            }
        });
    };

    public deleteOrphanConversations = async (tx?: IDBTransaction): Promise<void> => {
        tx ??= (await this.db).transaction([CONVERSATION_STORE, MESSAGE_STORE, SPACE_STORE], 'readwrite');
        const conversationStore = tx.objectStore(CONVERSATION_STORE);
        const messageStore = tx.objectStore(MESSAGE_STORE);
        const spaceStore = tx.objectStore(SPACE_STORE);

        return withCursor(conversationStore, async (cursor) => {
            const conversationId = cursor.value.id as ConversationId;
            const spaceId = cursor.value.spaceId as SpaceId;

            // Check if the conversation has an associated space
            const space = await requestToPromise(spaceStore.get(spaceId));
            if (!space) {
                // Check if there are any messages associated with this conversation
                const messageIndex = messageStore.index(MessageStoreIndexes.ConversationId);
                const messageCount = await requestToPromise(messageIndex.count(IDBKeyRange.only(conversationId)));

                // If there are no messages and no associated space, delete the conversation
                if (messageCount === 0) {
                    console.log(`Orphan conversation ${conversationId} found, deleting locally`);
                    await requestToPromise(conversationStore.delete(conversationId));
                    console.log(`Deleted orphan conversation ${cursor.value.id}`);
                }
            }
        });
    };

    public deleteOrphanAttachments = async (tx?: IDBTransaction): Promise<void> => {
        tx ??= (await this.db).transaction([ATTACHMENT_STORE, SPACE_STORE], 'readwrite');
        const attachmentStore = tx.objectStore(ATTACHMENT_STORE);
        const spaceStore = tx.objectStore(SPACE_STORE);
        const index = attachmentStore.index(AttachmentStoreIndexes.SpaceId);

        return withCursor(index, async (cursor) => {
            const spaceId = cursor.value.spaceId as SpaceId;
            const space = await requestToPromise(spaceStore.get(spaceId));

            if (!space) {
                console.log(`Orphan attachment ${cursor.value.id} found, deleting locally`);
                await requestToPromise(attachmentStore.delete(cursor.value.id));
                console.log(`Deleted orphan attachment ${cursor.value.id}`);
            }
        });
    };

    public softDeleteMessage = async (
        id: MessageId,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ): Promise<void> => {
        tx ??= (await this.db).transaction(MESSAGE_STORE, 'readwrite');
        const message = await this.getMessageById(id, tx);
        if (!message) throw new Error(`Message ${id} not found`);
        // Remove content from the encrypted data for security purposes, but keep the encrypted field
        // since the type requires it
        const secureMessage = {
            ...message,
            // If encrypted is present, set it to an empty secure value instead of removing it
            ...(message.encrypted ? { encrypted: '' } : {}),
            deleted: true as const,
        };
        await this.updateMessage(secureMessage, { dirty }, tx);
    };

    public softDeleteConversation = async (
        id: ConversationId,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ): Promise<void> => {
        tx ??= (await this.db).transaction(CONVERSATION_STORE, 'readwrite');
        const conversation = await this.getConversationById(id, tx);
        if (!conversation) throw new Error(`Conversation ${id} not found`);
        // Remove content from the encrypted data for security purposes, but keep the encrypted field
        // since the type requires it
        const secureConversation = {
            ...conversation,
            // Set encrypted to an empty secure value instead of removing it
            encrypted: '',
            deleted: true as const,
        };
        await this.updateConversation(secureConversation, { dirty }, tx);
    };

    public softDeleteSpace = async (id: SpaceId, { dirty }: { dirty: boolean }, tx?: IDBTransaction): Promise<void> => {
        tx ??= (await this.db).transaction(SPACE_STORE, 'readwrite');
        const space = await this.getSpaceById(id, tx);
        if (!space) throw new Error(`Space ${id} not found`);
        // Remove wrappedSpaceKey when deleting the space for security purposes
        const { wrappedSpaceKey, ...spaceWithoutKey } = space;
        const updatedSpace = {
            ...spaceWithoutKey,
            deleted: true as const, // explicitly set as true (const assertion)
        };
        await this.updateSpace(updatedSpace, { dirty }, tx);
    };

    public softDeleteAttachment = async (
        id: AttachmentId,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ): Promise<void> => {
        tx ??= (await this.db).transaction(ATTACHMENT_STORE, 'readwrite');
        const attachment = await this.getAttachmentById(id, tx);
        if (!attachment) throw new Error(`Attachment ${id} not found`);

        // Keep only essential metadata from AttachmentPub and remove heavy fields
        const { id: attachmentId, spaceId, uploadedAt, mimeType, rawBytes } = attachment;
        const updatedAttachment = {
            id: attachmentId,
            spaceId,
            uploadedAt,
            mimeType,
            rawBytes,
            deleted: true,
        } as SerializedAttachment;
        await this.updateAttachment(updatedAttachment, { dirty }, tx);
    };

    public softDeleteSpaceCascade = async (
        spaceId: SpaceId,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ): Promise<void> => {
        const stores = [SPACE_STORE, CONVERSATION_STORE, MESSAGE_STORE, ATTACHMENT_STORE];
        tx ??= (await this.db).transaction(stores, 'readwrite');

        const space = await this.getSpaceById(spaceId, tx);
        if (!space) {
            console.warn(`softDeleteSpaceCascade: ${spaceId} not found`);
            return;
        }

        // Soft delete all conversations in the space
        const conversations = await this.getConversationsBySpaceId(spaceId, tx);
        for (const conversation of conversations) {
            // Soft delete all messages in the conversation
            const messages = await this.getMessagesByConversationId(conversation.id, tx);
            for (const message of messages) {
                await this.softDeleteMessage(message.id, { dirty }, tx);
            }
            await this.softDeleteConversation(conversation.id, { dirty }, tx);
        }

        // Soft delete all attachments in the space
        const attachments = await this.getAttachmentsBySpaceId(spaceId, tx);
        for (const attachment of attachments) {
            await this.softDeleteAttachment(attachment.id, { dirty }, tx);
        }

        // Finally soft delete the space itself
        await this.softDeleteSpace(spaceId, { dirty }, tx);
    };

    public markSpaceAsSynced = async (spaceSnapshot: SerializedSpace, tx?: IDBTransaction): Promise<boolean> => {
        return this.spaceStore.markAsSynced(spaceSnapshot, 'space', tx);
    };

    public markConversationAsSynced = async (
        conversationSnapshot: SerializedConversation,
        tx?: IDBTransaction
    ): Promise<boolean> => {
        return this.conversationStore.markAsSynced(conversationSnapshot, 'conversation', tx);
    };

    public markMessageAsSynced = async (messageSnapshot: SerializedMessage, tx?: IDBTransaction): Promise<boolean> => {
        return this.messageStore.markAsSynced(messageSnapshot, 'message', tx);
    };

    public markAttachmentAsSynced = async (
        attachmentSnapshot: SerializedAttachment,
        tx?: IDBTransaction
    ): Promise<boolean> => {
        return this.attachmentStore.markAsSynced(attachmentSnapshot, 'attachment', tx);
    };

    private openDb = async (userId: string | undefined): Promise<IDBDatabase> => {
        return new Promise<IDBDatabase>(async (resolve, reject) => {
            const userAndSalt = `${userId}:${DB_NAME_SALT}`;
            const userHash = userId ? await computeSha256AsBase64(userAndSalt) : undefined;
            const dbName = userHash ? `${DB_BASE_NAME}_${userHash}` : DB_BASE_NAME;
            const dbVersion = 11;

            // Handle version downgrade by deleting the database if needed
            try {
                await handleIndexedDBVersionDowngrade(dbName, dbVersion);
            } catch (error) {
                console.error('[LumoDB] Error handling version downgrade:', error);
            }

            const request = indexedDB.open(dbName, dbVersion);
            request.onupgradeneeded = async (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const tx = (event.target as IDBOpenDBRequest).transaction;

                // Initial DB setup (version 6)
                if (event.oldVersion < 6) {
                    if (!db.objectStoreNames.contains(SPACE_STORE)) {
                        void db.createObjectStore(SPACE_STORE, { keyPath: SpaceStoreFields.Id });
                    }

                    if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
                        const conversationStore = db.createObjectStore(CONVERSATION_STORE, {
                            keyPath: ConversationStoreFields.Id,
                        });
                        conversationStore.createIndex(ConversationStoreIndexes.SpaceId, SpaceStoreFields.Id, {
                            unique: false,
                        });
                    }

                    if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
                        const messageStore = db.createObjectStore(MESSAGE_STORE, { keyPath: MessageStoreFields.Id });
                        messageStore.createIndex(MessageStoreIndexes.ConversationId, ConversationStoreFields.Id, {
                            unique: false,
                        });
                    }

                    if (!db.objectStoreNames.contains(REMOTE_ID_STORE)) {
                        const I = RemoteIdStoreIndexes;
                        const F = RemoteIdStoreFields;
                        const remoteIdStore = db.createObjectStore(REMOTE_ID_STORE, { keyPath: [F.Type, F.LocalId] });
                        remoteIdStore.createIndex(I.TypeRemoteId, [F.Type, F.RemoteId], { unique: true });
                    }
                }

                // Migration 6 -> 7
                if (event.oldVersion < 7) {
                    const conversationStore = tx?.objectStore(CONVERSATION_STORE);
                    if (!conversationStore) throw new Error(`Cannot get store ${JSON.stringify(CONVERSATION_STORE)}`);
                    conversationStore.deleteIndex(ConversationStoreIndexes.SpaceId);
                    conversationStore.createIndex(ConversationStoreIndexes.SpaceId, ConversationStoreFields.SpaceId, {
                        unique: false,
                    });

                    const messageStore = tx?.objectStore(MESSAGE_STORE);
                    if (!messageStore) throw new Error(`Cannot get store ${JSON.stringify(MESSAGE_STORE)}`);
                    messageStore.deleteIndex(MessageStoreIndexes.ConversationId);
                    messageStore.createIndex(MessageStoreIndexes.ConversationId, MessageStoreFields.ConversationId, {
                        unique: false,
                    });
                }

                // Migration 7 -> 8
                if (event.oldVersion < 8) {
                    if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
                        const F = AttachmentStoreFields;
                        const I = AttachmentStoreIndexes;
                        const attachmentStore = db.createObjectStore(ATTACHMENT_STORE, { keyPath: F.Id });
                        attachmentStore.createIndex(I.SpaceId, F.SpaceId, {
                            unique: false,
                        });
                    }
                }

                // Migration 8 -> 9
                if (event.oldVersion < 9) {
                    console.log('Upgrading IndexedDB from version', event.oldVersion, 'to 9 (adding assets store)');
                    if (!db.objectStoreNames.contains(ASSET_STORE)) {
                        const F = AttachmentStoreFields; // Assets use same fields structure
                        const I = AssetStoreIndexes;
                        const assetStore = db.createObjectStore(ASSET_STORE, { keyPath: F.Id });
                        assetStore.createIndex(I.SpaceId, F.SpaceId, {
                            unique: false,
                        });
                        console.log('Successfully created ASSET_STORE');
                    }

                    if (!db.objectStoreNames.contains(FOUNDATION_SEARCH_STORE)) {
                        const F = FoundationSearchStoreFields;
                        db.createObjectStore(FOUNDATION_SEARCH_STORE, {
                            keyPath: F.BlobName,
                        });
                    }
                }

                // Migration 9 -> 10: ensure foundation_search exists for existing v9 DBs
                if (event.oldVersion < 10) {
                    if (!db.objectStoreNames.contains(FOUNDATION_SEARCH_STORE)) {
                        const F = FoundationSearchStoreFields;
                        db.createObjectStore(FOUNDATION_SEARCH_STORE, {
                            keyPath: F.BlobName,
                        });
                        console.log('Successfully created FOUNDATION_SEARCH_STORE');
                    }
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    // todo: it is quite inefficient, and we'd better use an index
    public findUnsyncedResources = async (tx?: IDBTransaction): Promise<UnsyncedMaps> => {
        tx ??= (await this.db).transaction(
            [MESSAGE_STORE, CONVERSATION_STORE, SPACE_STORE, ATTACHMENT_STORE],
            'readonly'
        );

        const [allMessages, allConversations, allSpaces, allAttachments] = await Promise.all([
            this.getAllMessages(tx),
            this.getAllConversations(tx),
            this.getAllSpaces(tx),
            this.getAllAttachments(tx),
        ]);

        // Filter resources by dirty flag instead of checking remote IDs
        const unsyncedMessages = mapify(allMessages.filter((m) => m.dirty === true));
        const unsyncedConversations = mapify(allConversations.filter((c) => c.dirty === true));
        const unsyncedSpaces = mapify(allSpaces.filter((s) => s.dirty === true));
        const unsyncedAttachments = mapify(allAttachments.filter((a) => a.dirty === true));

        return { unsyncedMessages, unsyncedConversations, unsyncedSpaces, unsyncedAttachments };
    };

    // Foundation Search blob management
    public saveSearchBlob = async (
        blobName: string,
        blobData: Uint8Array<ArrayBuffer> | string,
        tx?: IDBTransaction
    ): Promise<void> => {
        tx ??= (await this.db).transaction([FOUNDATION_SEARCH_STORE], 'readwrite');
        const store = tx.objectStore(FOUNDATION_SEARCH_STORE);

        const blobEntry = {
            blobName,
            blobData,
            lastUpdated: Date.now(),
        };

        await requestToPromise(store.put(blobEntry));
    };

    public loadSearchBlob = async (
        blobName: string,
        tx?: IDBTransaction
    ): Promise<Uint8Array<ArrayBuffer> | string | null> => {
        tx ??= (await this.db).transaction([FOUNDATION_SEARCH_STORE], 'readonly');
        const store = tx.objectStore(FOUNDATION_SEARCH_STORE);

        const result = await requestToPromise(store.get(blobName));
        return result?.blobData || null;
    };

    public removeSearchBlob = async (blobName: string, tx?: IDBTransaction): Promise<void> => {
        tx ??= (await this.db).transaction([FOUNDATION_SEARCH_STORE], 'readwrite');
        const store = tx.objectStore(FOUNDATION_SEARCH_STORE);
        await requestToPromise(store.delete(blobName));
    };

    public clearAllSearchBlobs = async (keysToPreserve?: string[], tx?: IDBTransaction): Promise<void> => {

        tx ??= (await this.db).transaction([FOUNDATION_SEARCH_STORE], 'readwrite');
        const store = tx.objectStore(FOUNDATION_SEARCH_STORE);

        const preservedKeys = new Map<string, any>();

        for (const key of keysToPreserve || []) {
            const request = store.get(key);
            const result = await requestToPromise(request);
            if (result !== undefined) {
                preservedKeys.set(key, result);
            }
        }

        await requestToPromise(store.clear());

        for (const [, value] of preservedKeys.entries()) {
            await requestToPromise(store.put(value));
        }
    };

    public checkFoundationSearchStatus = async (): Promise<{
        tableExists: boolean;
        hasEntries: boolean;
        entryCount: number;
        totalBytes?: number;
        isEnabled: boolean;
    }> => {
        try {
            const db = await this.db;
            const tableExists = db.objectStoreNames.contains(FOUNDATION_SEARCH_STORE);

            if (!tableExists) {
                return { tableExists: false, hasEntries: false, entryCount: 0, totalBytes: 0, isEnabled: true };
            }

            const tx = db.transaction([FOUNDATION_SEARCH_STORE], 'readonly');
            const store = tx.objectStore(FOUNDATION_SEARCH_STORE);
            const entries = await requestToPromise(store.getAll());
            const count = entries.length;
            const totalBytes = entries.reduce((acc: number, entry: any) => {
                const data = entry?.blobData;
                if (!data) return acc;
                if (typeof data === 'string') {
                    // base64 size approximation
                    return acc + Math.floor(data.length * 0.75);
                }
                if (data instanceof Uint8Array) {
                    return acc + data.byteLength;
                }
                if (typeof data.byteLength === 'number') {
                    return acc + data.byteLength;
                }
                return acc;
            }, 0);

            return {
                tableExists: true,
                hasEntries: count > 0,
                entryCount: count,
                totalBytes,
                isEnabled: true,
            };
        } catch (error) {
            console.warn('Failed to check foundation search status:', error);
            return { tableExists: false, hasEntries: false, entryCount: 0, totalBytes: 0, isEnabled: true };
        }
    };
}
