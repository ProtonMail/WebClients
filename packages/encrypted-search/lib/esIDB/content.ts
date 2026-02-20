import type { IndexKey } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';

import { STORING_OUTCOME } from '../constants';
import { ciphertextSize, decryptFromDB } from '../esHelpers';
import type { EncryptedItemWithInfo } from '../models';
import { updateSize } from './configObjectStore';
import { openESDB, safelyWriteToIDBConditionally } from './indexedDB';

/**
 * Get a decrypted content item from IndexedDB
 */
export const readContentItem = async <ESItemContent>(userID: string, itemID: string, indexKey: IndexKey) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const aesGcmCiphertext = await esDB.get('content', itemID);
    esDB.close();

    if (!aesGcmCiphertext) {
        return;
    }

    return decryptFromDB<ESItemContent>({ aesGcmCiphertext, indexKey, source: 'readContentItem' });
};

/**
 * Fetch the number of items from the content table
 */
export const readNumContent = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }
    const count = await esDB.count('content');
    esDB.close();
    return count;
};

/**
 * Read a batch of content items specified by their IDs
 */
export const readContentBatch = async (userID: string, IDs: string[]) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const count = await esDB.count('content');
    if (count === 0) {
        esDB.close();
        return [];
    }

    const tx = esDB.transaction('content', 'readonly');
    const content = await Promise.all(IDs.map((ID) => tx.store.get(ID)));

    await tx.done;
    esDB.close();

    return content;
};

/**
 * Remove items from and write items to the content table of IDB. Note
 * that this function will throw if the IDB quota is exceeded, therefore
 * a check needs to happen in advance to verify all items to add do fit
 */
export const executeContentOperations = async ({
    userID,
    itemsToRemove,
    itemsToAdd,
}: {
    userID: string;
    itemsToRemove: string[];
    itemsToAdd: EncryptedItemWithInfo[];
}) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const tx = esDB.transaction('content', 'readwrite');

    const removeSizes = await Promise.all(
        itemsToRemove.map((ID) =>
            tx.store.get(ID).then((aesGcmCiphertext) => {
                void tx.store.delete(ID);
                return ciphertextSize(aesGcmCiphertext);
            })
        )
    );
    await tx.done;

    await updateSize(esDB, -1 * removeSizes.reduce((p, c) => p + c, 0));

    const storingOutcomes: STORING_OUTCOME[] = [];

    // Then all items to add are inserted
    for (const itemToAdd of itemsToAdd) {
        storingOutcomes.push(await safelyWriteToIDBConditionally({ value: itemToAdd, storeName: 'content', esDB }));
    }

    esDB.close();

    if (storingOutcomes.some((storingOutcome) => storingOutcome === STORING_OUTCOME.QUOTA)) {
        return STORING_OUTCOME.QUOTA;
    }
    return STORING_OUTCOME.SUCCESS;
};
