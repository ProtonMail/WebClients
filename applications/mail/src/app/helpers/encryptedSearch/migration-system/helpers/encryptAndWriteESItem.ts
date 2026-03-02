import { serializeAndEncryptItem } from '@proton/encrypted-search/esHelpers';

import type { DBType, EncryptedSearchData } from '../interface';

interface EncryptAndWriteProps {
    esDB: DBType;
    indexKey: CryptoKey;
    item: EncryptedSearchData;
}

/**
 * Update an existing item content and metadata to the encrypted search database
 */
export const encryptAndWriteESItem = async ({ esDB, indexKey, item }: EncryptAndWriteProps): Promise<void> => {
    const itemID = item.metadata?.ID;
    if (!itemID) {
        throw new Error('Item has no ID');
    }

    const contentVersion = item.content?.version || 1;

    // Encryption is done before opening the transaction to avoid auto-commit
    const [encryptedMetadata, encryptedContent] = await Promise.all([
        // The metadata is not versioned yet, starting at 1
        item.metadata ? serializeAndEncryptItem(indexKey, item.metadata, 1) : undefined,
        item.content ? serializeAndEncryptItem(indexKey, item.content, contentVersion) : undefined,
    ]);

    const existingMetadata = await esDB.get('metadata', itemID);
    if (!existingMetadata?.timepoint) {
        throw new Error(`No existing metadata found for item ${itemID}`);
    }

    // IDB transactions are serialized by the browser, no locking checks needed
    const tx = esDB.transaction(['metadata', 'content'], 'readwrite');

    try {
        await Promise.all([
            encryptedMetadata
                ? tx
                      .objectStore('metadata')
                      .put({ timepoint: existingMetadata.timepoint, aesGcmCiphertext: encryptedMetadata }, itemID)
                : Promise.resolve(),
            encryptedContent
                ? tx.objectStore('content').put({ ...encryptedContent, version: contentVersion }, itemID)
                : Promise.resolve(),
        ]);

        await tx.done;
    } catch (error) {
        tx.abort();
        throw error;
    }
};
