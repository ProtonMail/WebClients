import type { IDBPDatabase } from 'idb';

import { decryptFromDB, getIndexKey } from '@proton/encrypted-search/esHelpers';
import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';
import type {
    ESCiphertext,
    ESItem,
    EncryptedMetadataItem,
    EncryptedSearchDB,
} from '@proton/encrypted-search/lib/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';

import type { ImportIssue } from './Import';
import { ImportIssueSeverity } from './Import';

/**
 * Stateful cursor over the encrypted-search index.
 * Delegates reading to the reader class,
 * but keeps track where to read the next batch from.
 */
export class BatchReader {
    private offset: number = 0;

    constructor(
        private ids: string[],
        private readBatch: (typeof EncryptedSearchReader.prototype)['readBatch']
    ) {}

    get totalCount(): number {
        return this.ids.length;
    }

    async readNextBatch(
        batchSize: number,
        reportCallback: ((err: ImportIssue) => void) | undefined
    ): Promise<undefined | { metadata: ESBaseMessage; body: string }[]> {
        const batchIds = this.ids.slice(this.offset, this.offset + batchSize);
        // signal exhaustion with undefined; an empty array is truthy and would spin the caller's loop.
        if (batchIds.length === 0) {
            return undefined;
        }
        const messages = await this.readBatch(batchIds, reportCallback);
        this.offset += batchIds.length;
        return messages;
    }
}

function validateMetadata(metadata: ESBaseMessage, reportCallback: ((err: ImportIssue) => void) | undefined): boolean {
    if (!metadata.Sender?.Address) {
        reportCallback?.({ message: 'no sender address', id: metadata.ID, severity: ImportIssueSeverity.Error });
        return false;
    }
    return true;
}

export class EncryptedSearchReader {
    constructor(
        private db: IDBPDatabase<EncryptedSearchDB>,
        private indexKey: CryptoKey
    ) {}

    static async open(userId: string, userKeys: DecryptedKey[]): Promise<EncryptedSearchReader | undefined> {
        // Never create the v1 ES DB: `getIndexKey` and `openESDB` both create an empty shell if it's
        // absent, which then makes `hasESDB` report true and breaks v1's own enable flow. If there's
        // no v1 index there's nothing to read, so return undefined instead.
        if (!(await hasESDB(userId))) {
            return undefined;
        }
        const indexKey = await getIndexKey(userKeys, userId);
        if (!indexKey) {
            throw new Error('could not get key for old index');
        }
        return EncryptedSearchReader.openWithIndexKey(userId, indexKey);
    }

    static async openWithIndexKey(userId: string, indexKey: CryptoKey): Promise<EncryptedSearchReader | undefined> {
        // See `open`: bail out before `openESDB` creates an empty shell for a non-existent v1 index.
        if (!(await hasESDB(userId))) {
            return undefined;
        }
        const db = await openESDB(userId);
        if (!db) {
            throw new Error('could not open old index db');
        }
        return new EncryptedSearchReader(db, indexKey);
    }

    getTotalMessageCount(): Promise<number | undefined> {
        return this.db.transaction('metadata').store.count();
    }

    /** read messages to display them in the search result set, uses same message return type for that reason */
    async readMessages(ids: string[]): Promise<ESItem<ESBaseMessage, ESMessageContent>[]> {
        const results = await this.createBatchReader(ids).readNextBatch(ids.length, undefined);
        if (!results) {
            return [];
        }
        return results.map((r) => {
            return { ...r.metadata, ...{ decryptedBody: r.body } };
        });
    }

    async iterateSortedMessageIds(callback: (id: string) => void): Promise<void> {
        const txn = this.db.transaction('metadata', 'readonly');
        let cursor = await txn.store.openKeyCursor();
        while (cursor) {
            callback(cursor.key);
            cursor = await cursor.continue();
        }
    }

    close() {
        this.db.close();
    }

    /**
     * Create a reader that walks the index in batches, keeping track of its own
     * position so successive calls resume where the previous one left off.
     */
    createBatchReader(ids: string[]): BatchReader {
        return new BatchReader(ids, this.readBatch.bind(this));
    }

    private async readBatch(
        ids: string[],
        reportCallback: ((err: ImportIssue) => void) | undefined
    ): Promise<undefined | { metadata: ESBaseMessage; body: string }[]> {
        const txn = this.db.transaction(['metadata', 'content'], 'readonly');
        const metadataStore = txn.objectStore('metadata');
        const contentStore = txn.objectStore('content');
        // read everything in one txn first
        const encrypted = (
            await Promise.all(
                ids.map(async (id) => {
                    const metadata = await metadataStore.get(id);
                    if (metadata) {
                        const content = await contentStore.get(id);
                        return { id, metadata, content };
                    }
                })
            )
        ).filter(isTruthy);
        // then decrypt
        const decrypted = await Promise.all(
            encrypted.map(async ({ id, metadata: encryptedMetadata, content: encryptedContent }) => {
                try {
                    const { metadata, content } = await this.decryptMessage(id, encryptedMetadata, encryptedContent);
                    if (content === undefined) {
                        reportCallback?.({
                            message: `No content found for message`,
                            id,
                            severity: ImportIssueSeverity.Error,
                        });
                    } else if (!content.decryptedBody) {
                        reportCallback?.({
                            message: `Empty decrypted body`,
                            id,
                            severity: ImportIssueSeverity.Warning,
                        });
                    }
                    return { metadata, body: content?.decryptedBody || '' };
                } catch (err) {
                    reportCallback?.({ message: (err as Error).message, id, severity: ImportIssueSeverity.Error });
                    return undefined;
                }
            })
        );
        const results = decrypted.filter((d): d is Exclude<(typeof decrypted)[number], undefined> => {
            if (d === undefined || !validateMetadata(d.metadata, reportCallback)) {
                return false;
            }
            return true;
        });
        return results;
    }

    private async decryptMessage(
        id: string,
        encryptedMetadata: EncryptedMetadataItem,
        encryptedContent: ESCiphertext | undefined
    ): Promise<{ metadata: ESBaseMessage; content: ESMessageContent | undefined }> {
        const [metadataResult, contentResult] = await Promise.allSettled([
            decryptFromDB<ESBaseMessage>({
                aesGcmCiphertext: encryptedMetadata.aesGcmCiphertext,
                indexKey: this.indexKey,
                source: 'readMetadataItem',
            }),
            encryptedContent
                ? decryptFromDB<ESMessageContent>({
                      aesGcmCiphertext: encryptedContent,
                      indexKey: this.indexKey,
                      source: 'readContentItem',
                  })
                : undefined,
        ]);
        if (metadataResult.status === 'rejected') {
            throw new Error(`Could not decrypt metadata for: ${metadataResult.reason}`);
        }
        if (contentResult.status === 'rejected') {
            throw new Error(`Could not decrypt content for: ${contentResult.reason}`);
        }
        return {
            metadata: metadataResult.value,
            content: contentResult.value,
        };
    }
}
