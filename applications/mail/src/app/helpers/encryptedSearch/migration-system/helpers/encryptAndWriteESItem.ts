import type { IDBPDatabase } from 'idb';

import { serializeAndEncryptItem } from '@proton/encrypted-search/esHelpers';
import type { ESCiphertext, EncryptedSearchDB } from '@proton/encrypted-search/models';

import type { EncryptedSearchData } from '../interface';

interface EncryptAndWriteProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    item: EncryptedSearchData;
    originalEncryptedData: ESCiphertext;
}

/**
 * Update an existing item content and metadata to the encrypted search database
 */
export const encryptAndWriteESItem = async ({
    esDB,
    indexKey,
    item,
    originalEncryptedData,
}: EncryptAndWriteProps): Promise<void> => {
    const itemID = item.metadata?.ID;
    const version = item.content?.version;
    if (!version || !itemID || !item.content) {
        throw new Error('Item has no version, ID, or content');
    }

    // Encryption is done before opening the transaction to avoid auto-commit
    const encryptedContent = await serializeAndEncryptItem(indexKey, item.content, version);

    // IDB transactions are serialized by the browser, no locking checks needed
    const tx = esDB.transaction(['content'], 'readwrite');

    const storeItem = await tx.objectStore('content').get(itemID);
    const storeItemSize = storeItem?.ciphertext.byteLength;
    const originalSize = originalEncryptedData.ciphertext.byteLength;
    // Compare the size of the stored item with the original size to avoid overwriting updated data
    if (storeItemSize !== originalSize) {
        return;
    }

    await tx.objectStore('content').put(encryptedContent, itemID);
    await tx.done;
};
