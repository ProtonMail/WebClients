import type { IDBPDatabase } from 'idb';

import { ciphertextSize, serializeAndEncryptItem } from '@proton/encrypted-search/esHelpers';
import type { ESCiphertext, EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { PreparedMessageContent } from '../interface';

interface EncryptAndWriteProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    items: PreparedMessageContent[];
}

const isContentTheSame = (before: ESCiphertext | undefined, after: ESCiphertext | undefined): boolean => {
    const sizeBefore = ciphertextSize(before);
    const sizeAfter = ciphertextSize(after);

    // Compare the size of the stored item with the original size to avoid overwriting updated data
    if (sizeBefore !== sizeAfter || !after?.ciphertext) {
        return false;
    }

    const cipherBefore = new Uint8Array(before?.ciphertext ?? []);
    const cipherAfter = new Uint8Array(after.ciphertext);

    for (let i = 0; i < cipherBefore.length; i++) {
        if (cipherBefore[i] !== cipherAfter[i]) {
            return false;
        }
    }

    return true;
};

/**
 * Update an existing item content and metadata to the encrypted search database
 */
export const encryptAndWriteESItems = async ({ esDB, indexKey, items }: EncryptAndWriteProps): Promise<void> => {
    const encryptedItems = (
        await Promise.all(
            items.map(async ({ updated, original, itemID }) => {
                const version = updated?.version;
                if (!version) {
                    traceInitiativeError(
                        SentryMailInitiatives.MIGRATION_TOOL,
                        new Error('Item missing ID, version, or content')
                    );
                    return null;
                }

                // Encryption is done before opening the transaction to avoid auto-commit
                const encryptedContent = await serializeAndEncryptItem(indexKey, updated, version);
                return { encryptedContent, original: original, id: itemID };
            })
        )
    ).filter((item) => item !== null);

    // IDB transactions are serialized by the browser, no locking checks needed
    const tx = esDB.transaction('content', 'readwrite');

    encryptedItems.forEach(async (data) => {
        const storeItem = await tx.objectStore('content').get(data.id);

        const isSimilar = isContentTheSame(data.original, storeItem);
        if (!isSimilar) {
            return;
        }

        void tx.objectStore('content').put(data.encryptedContent, data.id);
    });

    await tx.done;
};
