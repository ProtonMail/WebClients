import type { IDBPDatabase } from 'idb';

import { decryptFromDB, getIndexKey } from '@proton/encrypted-search/esHelpers';
import { openESDB } from '@proton/encrypted-search/esIDB';
import type {
    ESCiphertext,
    ESItem,
    EncryptedMetadataItem,
    EncryptedSearchDB,
} from '@proton/encrypted-search/lib/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch';

import type { ImportIssue } from './Importer';
import { ImportIssueSeverity } from './Importer';

/**
 * Stateful cursor over the encrypted-search index.
 * Delegates reading to the reader class,
 * but keeps track where to read the next batch from.
 */
class BatchReader {
    private lastId: string | undefined;

    constructor(private readBatch: (typeof EncryptedSearchReader.prototype)['readBatch']) {}

    readNextBatch(
        amount: number,
        reportCallback: (err: ImportIssue) => void,
        abortSignal: AbortSignal
    ): Promise<undefined | { metadata: ESBaseMessage; body: string }[]> {
        return this.readBatch(this.lastId, amount, reportCallback, (id) => (this.lastId = id), abortSignal);
    }
}

function validateMetadata(metadata: ESBaseMessage, reportCallback: (err: ImportIssue) => void): boolean {
    if (!metadata.Sender?.Address) {
        reportCallback({ message: 'no sender address', id: metadata.ID, severity: ImportIssueSeverity.Error });
        return false;
    }
    return true;
}

export class EncryptedSearchReader {
    constructor(
        private db: IDBPDatabase<EncryptedSearchDB>,
        private indexKey: CryptoKey
    ) {}

    static async open(userId: string, userKeys: DecryptedKey[]): Promise<EncryptedSearchReader> {
        const indexKey = await getIndexKey(userKeys, userId);
        if (!indexKey) {
            throw new Error('could not get key for old index');
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

    async readMessages(ids: string[]): Promise<ESItem<ESBaseMessage, ESMessageContent>[]> {
        const txn = this.db.transaction(['metadata', 'content'], 'readonly');
        const metadataStore = txn.objectStore('metadata');
        const contentStore = txn.objectStore('content');

        const items = await Promise.all(
            ids.map(async (id) => {
                const [encryptedMetadata, encryptedContent] = await Promise.all([
                    metadataStore.get(id),
                    contentStore.get(id),
                ]);
                if (!encryptedMetadata) {
                    return undefined;
                }

                const { metadata, content } = await this.decryptMessage(id, encryptedMetadata, encryptedContent);
                return {
                    ...metadata,
                    ...content,
                };
            })
        );

        return items.filter(isTruthy);
    }

    /**
     * Create a reader that walks the index in batches, keeping track of its own
     * position so successive calls resume where the previous one left off.
     */
    createBatchReader(): BatchReader {
        return new BatchReader(this.readBatch.bind(this));
    }

    close() {
        this.db.close();
    }

    private async readBatch(
        lastId: string | undefined,
        amount: number,
        reportCallback: (err: ImportIssue) => void,
        advanceId: (lastId: string) => void,
        abortSignal: AbortSignal
    ): Promise<undefined | { metadata: ESBaseMessage; body: string }[]> {
        const txn = this.db.transaction(['metadata', 'content'], 'readonly');
        const encrypted = [];
        const it = await txn.objectStore('metadata').iterate(IDBKeyRange.lowerBound(lastId ?? '', true));
        for await (const cursor of it) {
            abortSignal.throwIfAborted();
            const id = cursor.key;
            advanceId(id);
            const metadata = cursor.value;
            const content = await txn.objectStore('content').get(id);
            abortSignal.throwIfAborted();
            encrypted.push({ id, metadata, content });
            if (encrypted.length >= amount) {
                break;
            }
        }
        if (encrypted.length === 0) {
            return undefined; // signal done
        }
        const decrypted = await Promise.all(
            encrypted.map(async ({ id, metadata: encryptedMetadata, content: encryptedContent }) => {
                abortSignal.throwIfAborted();
                try {
                    const { metadata, content } = await this.decryptMessage(id, encryptedMetadata, encryptedContent);
                    abortSignal.throwIfAborted();
                    if (content === undefined) {
                        reportCallback({
                            message: `No content found for message`,
                            id,
                            severity: ImportIssueSeverity.Error,
                        });
                    } else if (!content.decryptedBody) {
                        reportCallback({ message: `Empty decrypted body`, id, severity: ImportIssueSeverity.Warning });
                    }
                    return { metadata, body: content?.decryptedBody || '' };
                } catch (err) {
                    reportCallback({ message: (err as Error).message, id, severity: ImportIssueSeverity.Error });
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
