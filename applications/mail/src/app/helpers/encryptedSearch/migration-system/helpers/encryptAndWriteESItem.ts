import { serializeAndEncryptItem } from '@proton/encrypted-search/esHelpers';

import type { DBType, EncryptedSearchData } from '../interface';

interface EncryptAndWriteProps {
    esDB: DBType;
    indexKey: CryptoKey;
    item: EncryptedSearchData;
    version: number;
}

/**
 * Update an existing item content and metadata to the encrypted search database
 */
export const encryptAndWriteESItem = async ({ esDB, indexKey, item, version }: EncryptAndWriteProps): Promise<void> => {
    const itemID = item.metadata?.ID;
    if (!itemID) {
        throw new Error('Item has no ID');
    }

    // Encryption is done before opening the transaction to avoid auto-commit
    const encryptedContent = item.content ? await serializeAndEncryptItem(indexKey, item.content, version) : undefined;

    // IDB transactions are serialized by the browser, no locking checks needed
    const tx = esDB.transaction(['metadata', 'content'], 'readwrite');

    if (!encryptedContent) {
        return;
    }

    try {
        await tx.objectStore('content').put({ ...encryptedContent, version }, itemID);
        await tx.done;
    } catch (error) {
        tx.abort();
        throw error;
    }
};
