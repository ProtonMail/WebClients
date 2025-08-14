/* eslint-disable @typescript-eslint/lines-between-class-members */
import isEqual from 'lodash/isEqual';

import { computeSha256AsBase64 } from '../crypto';
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

export const SPACE_STORE = 'spaces_v4';
export const CONVERSATION_STORE = 'conversations_v4';
export const MESSAGE_STORE = 'messages_v4';
export const ATTACHMENT_STORE = 'attachments_v4';
export const REMOTE_ID_STORE = 'remote_ids_v4';

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

export enum RemoteIdStoreIndexes {
    TypeRemoteId = 'idx_type_remoteId',
}

// @ts-ignore
type SerializedResource = SerializedAttachment | SerializedMessage | SerializedSpace | SerializedConversation;

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
        private readonly db: Promise<IDBDatabase>,
        private readonly config: StoreConfig<T>
    ) {}

    async add(object: T, { dirty }: { dirty: boolean }, tx?: IDBTransaction): Promise<void> {
        tx ??= await this.getTransaction('readwrite');
        const store = tx.objectStore(this.config.storeName);
        console.log(`Adding ${this.config.type} ${object.id}`);

        const cleanedObject = this.config.cleanFunction({ ...object, dirty });

        return new Promise<void>((resolve, reject) => {
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
                    reject();
                }
            };
        });
    }

    async update(object: T, { dirty }: { dirty: boolean }, tx?: IDBTransaction): Promise<void> {
        tx ??= await this.getTransaction('readwrite');
        const store = tx.objectStore(this.config.storeName);
        console.log(`Updating ${this.config.type} ${object.id}`);

        const cleanedObject = this.config.cleanFunction({ ...object, dirty });

        return new Promise<void>((resolve, reject) => {
            const request = store.put(cleanedObject);
            request.onsuccess = () => {
                console.log(`${this.config.type} ${object.id} updated successfully on IDB!`, object);
                resolve();
            };
            request.onerror = () => {
                console.error(`Error updating ${this.config.type}: ${request.error?.toString()}`);
                reject();
            };
        });
    }

    async getById(id: string, tx?: IDBTransaction): Promise<T | undefined> {
        tx ??= await this.getTransaction('readonly');
        const store = tx.objectStore(this.config.storeName);

        return new Promise<T | undefined>((resolve, reject) => {
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
        });
    }

    async getAll(tx?: IDBTransaction): Promise<T[]> {
        tx ??= await this.getTransaction('readonly');
        const store = tx.objectStore(this.config.storeName);

        return new Promise<T[]>((resolve, reject) => {
            const request = store.getAll() as IDBRequest<T[]>;
            request.onsuccess = () => {
                resolve(request.result.map(this.config.cleanFunction));
            };
            request.onerror = () => {
                console.error(`Error retrieving all items: ${request.error?.toString()}`);
                reject();
            };
        });
    }

    async delete(id: string, tx?: IDBTransaction): Promise<void> {
        tx ??= await this.getTransaction('readwrite');
        const store = tx.objectStore(this.config.storeName);
        console.log(`Deleting ${this.config.type} ${id}`);

        return new Promise<void>((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                console.log(`${this.config.type} ${id} deleted successfully!`);
                resolve();
            };
            request.onerror = () => {
                console.error(`Error deleting item: ${request.error?.toString()}`);
                reject();
            };
        });
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

    markAsSynced(snapshot: T, resourceType: ResourceType, tx?: IDBTransaction): Promise<boolean> {
        const id = snapshot.id;
        console.log(`Marking ${resourceType} ${id} as synced`);
        return this.getTransaction('readwrite')
            .then((tx) => this.getById(id, tx).then((objectInDb) => ({ tx, objectInDb })))
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
};

export type UnsyncedMaps = {
    unsyncedMessages: SerializedMessageMap;
    unsyncedConversations: SerializedConversationMap;
    unsyncedSpaces: SerializedSpaceMap;
    unsyncedAttachments: SerializedAttachmentMap;
};

export class DbApi {
    private readonly db: Promise<IDBDatabase>;
    private readonly spaceStore: StoreOperations<SerializedSpace>;
    private readonly conversationStore: StoreOperations<SerializedConversation>;
    private readonly messageStore: StoreOperations<SerializedMessage>;
    private readonly attachmentStore: StoreOperations<SerializedAttachment>;

    constructor(userId: string | undefined) {
        this.db = this.openDb(userId);

        // Initialize store operations
        this.spaceStore = new StoreOperations(this.db, storeConfigs.space);
        this.conversationStore = new StoreOperations(this.db, storeConfigs.conversation);
        this.messageStore = new StoreOperations(this.db, storeConfigs.message);
        this.attachmentStore = new StoreOperations(this.db, storeConfigs.attachment);
    }

    public newTransaction = async (storeName: string | string[], mode?: IDBTransactionMode) => {
        return (await this.db).transaction(storeName, mode ?? 'readwrite');
    };

    // Message operations
    public addMessage = async (message: SerializedMessage, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.messageStore.add(message, { dirty }, tx);
    };

    public updateMessage = async (message: SerializedMessage, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.messageStore.update(message, { dirty }, tx);
    };

    public getMessageById = async (id: MessageId, tx?: IDBTransaction) => {
        return this.messageStore.getById(id, tx);
    };

    // Conversation operations
    public addConversation = async (
        conversation: SerializedConversation,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.conversationStore.add(conversation, { dirty }, tx);
    };

    public updateConversation = async (
        conversation: SerializedConversation,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.conversationStore.update(conversation, { dirty }, tx);
    };

    public getConversationById = async (id: ConversationId, tx?: IDBTransaction) => {
        return this.conversationStore.getById(id, tx);
    };

    // Space operations
    public addSpace = async (space: SerializedSpace, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.spaceStore.add(space, { dirty }, tx);
    };

    public updateSpace = async (space: SerializedSpace, { dirty }: { dirty: boolean }, tx?: IDBTransaction) => {
        return this.spaceStore.update(space, { dirty }, tx);
    };

    public getSpaceById = async (id: SpaceId, tx?: IDBTransaction) => {
        return this.spaceStore.getById(id, tx);
    };

    public deleteSpace = async (id: SpaceId, tx?: IDBTransaction) => {
        return this.spaceStore.delete(id, tx);
    };

    // Attachment operations
    public addAttachment = async (
        attachment: SerializedAttachment,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.attachmentStore.add(attachment, { dirty }, tx);
    };

    public updateAttachment = async (
        attachment: SerializedAttachment,
        { dirty }: { dirty: boolean },
        tx?: IDBTransaction
    ) => {
        return this.attachmentStore.update(attachment, { dirty }, tx);
    };

    public getAttachmentById = async (id: AttachmentId, tx?: IDBTransaction) => {
        return this.attachmentStore.getById(id, tx);
    };

    public deleteAttachment = async (id: AttachmentId, tx?: IDBTransaction) => {
        return this.attachmentStore.delete(id, tx);
    };

    // Bulk operations
    public getAllSpaces = async (tx?: IDBTransaction): Promise<SerializedSpace[]> => {
        return this.spaceStore.getAll(tx);
    };

    public getAllConversations = async (tx?: IDBTransaction): Promise<SerializedConversation[]> => {
        return this.conversationStore.getAll(tx);
    };

    public getAllMessages = async (tx?: IDBTransaction): Promise<SerializedMessage[]> => {
        return this.messageStore.getAll(tx);
    };

    public getAllAttachments = async (tx?: IDBTransaction): Promise<SerializedAttachment[]> => {
        return this.attachmentStore.getAll(tx);
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
            const request = indexedDB.open(dbName, 8);

            request.onupgradeneeded = async (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const tx = (event.target as IDBOpenDBRequest).transaction;

                // Initial DB setup (version 6)
                if (event.oldVersion < 6) {
                    // Create space store
                    if (!db.objectStoreNames.contains(SPACE_STORE)) {
                        void db.createObjectStore(SPACE_STORE, { keyPath: SpaceStoreFields.Id });
                    }

                    // Create conversation store
                    if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
                        const conversationStore = db.createObjectStore(CONVERSATION_STORE, {
                            keyPath: ConversationStoreFields.Id,
                        });
                        conversationStore.createIndex(ConversationStoreIndexes.SpaceId, SpaceStoreFields.Id, {
                            unique: false,
                        });
                    }

                    // Create message store
                    if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
                        const messageStore = db.createObjectStore(MESSAGE_STORE, { keyPath: MessageStoreFields.Id });
                        messageStore.createIndex(MessageStoreIndexes.ConversationId, ConversationStoreFields.Id, {
                            unique: false,
                        });
                    }

                    // Create local <-> remote ID store
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
}
