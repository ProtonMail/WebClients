import type { IDBPDatabase } from 'idb';

import { decryptFromDB, getIndexKey } from '@proton/encrypted-search/esHelpers';
import { openESDB } from '@proton/encrypted-search/esIDB';
import type { ESCiphertext, EncryptedMetadataItem, EncryptedSearchDB } from '@proton/encrypted-search/lib/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch';

import type { ImportIssue } from './Importer.ts';
import { ImportIssueSeverity } from './Importer.ts';

function validateMetadata(metadata: ESBaseMessage, reportCallback: (err: ImportIssue) => void): boolean {
    if (!metadata.Sender?.Address) {
        reportCallback({ message: 'no sender address', id: metadata.ID, severity: ImportIssueSeverity.Error });
        return false;
    }
    return true;
}

export class EncryptedSearchReader {
    private lastId: string | undefined;

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

    async readNextBatch(
        amount: number,
        reportCallback: (err: ImportIssue) => void,
        abortSignal: AbortSignal
    ): Promise<undefined | { metadata: ESBaseMessage; body: string }[]> {
        abortSignal.throwIfAborted();
        const txn = this.db.transaction(['metadata', 'content'], 'readonly');
        const encrypted = [];
        const it = await txn.objectStore('metadata').iterate(IDBKeyRange.lowerBound(this.lastId ?? '', true));
        for await (const cursor of it) {
            const id = cursor.key;
            this.lastId = id;
            const metadata = cursor.value;
            const content = await txn.objectStore('content').get(id);
            abortSignal.throwIfAborted();
            if (content) {
                encrypted.push({ id, metadata, content });
            } else {
                reportCallback({
                    message: `No content found for message`,
                    id,
                    severity: ImportIssueSeverity.Error,
                });
            }
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
                    return await this.decryptMessage(id, encryptedMetadata, encryptedContent, reportCallback);
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
        encryptedContent: ESCiphertext,
        reportCallback: (err: ImportIssue) => void
    ): Promise<{ metadata: ESBaseMessage; body: string }> {
        const [metadataResult, contentResult] = await Promise.allSettled([
            decryptFromDB<ESBaseMessage>({
                aesGcmCiphertext: encryptedMetadata.aesGcmCiphertext,
                indexKey: this.indexKey,
                source: 'readMetadataItem',
            }),
            decryptFromDB<ESMessageContent>({
                aesGcmCiphertext: encryptedContent,
                indexKey: this.indexKey,
                source: 'readContentItem',
            }),
        ]);
        if (metadataResult.status === 'rejected') {
            throw new Error(`Could not decrypt metadata for: ${metadataResult.reason}`);
        }
        if (contentResult.status === 'rejected') {
            throw new Error(`Could not decrypt content for: ${contentResult.reason}`);
        }
        if (!contentResult.value.decryptedBody) {
            reportCallback({ message: `Empty decrypted body`, id, severity: ImportIssueSeverity.Warning });
        }
        return {
            metadata: metadataResult.value,
            body: contentResult.value.decryptedBody || '',
        };
    }
}
