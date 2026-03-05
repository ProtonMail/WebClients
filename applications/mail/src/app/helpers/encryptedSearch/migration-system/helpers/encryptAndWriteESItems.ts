import type { IDBPDatabase } from 'idb';

import { ciphertextSize, serializeAndEncryptItem } from '@proton/encrypted-search/esHelpers';
import type { ESCiphertext, EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { EncryptedSearchData } from '../interface';

interface EncryptAndWriteProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    items: { original: ESCiphertext; updated: EncryptedSearchData }[];
}

/**
 * Update an existing item content and metadata to the encrypted search database
 */
export const encryptAndWriteESItems = async ({ esDB, indexKey, items }: EncryptAndWriteProps): Promise<void> => {
    const encryptedItems = [];

    for (const { updated, original } of items) {
        const itemID = updated.metadata?.ID;
        const version = updated.content?.version;
        if (!version || !itemID || !updated.content) {
            traceInitiativeError(
                SentryMailInitiatives.MIGRATION_TOOL,
                new Error('Item missing ID, version, or content')
            );
            continue;
        }

        // Encryption is done before opening the transaction to avoid auto-commit
        const encryptedContent = await serializeAndEncryptItem(indexKey, updated.content, version);
        encryptedItems.push({ encryptedContent, original: original, id: itemID });
    }

    // IDB transactions are serialized by the browser, no locking checks needed
    const tx = esDB.transaction('content', 'readwrite');

    encryptedItems.forEach(async (data) => {
        const storeItem = await tx.objectStore('content').get(data.id);

        const storeItemSize = ciphertextSize(storeItem);
        const originalSize = ciphertextSize(data.original);
        // Compare the size of the stored item with the original size to avoid overwriting updated data
        if (storeItemSize !== originalSize) {
            return;
        }

        await tx.objectStore('content').put(data.encryptedContent, data.id);
    });

    await tx.done;
};
