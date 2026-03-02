import type { DBType, EncryptedSearchData } from '../interface';
import { decryptESItem } from './decryptESItem';

interface GetDecryptedESItemsProps {
    contentIDs: string[];
    esDB: DBType;
    indexKey: CryptoKey;
}

/**
 * Decrypt the content and metadata of a list of items (contentIDs)
 */
export const getDecryptedESItems = async ({ contentIDs, esDB, indexKey }: GetDecryptedESItemsProps) => {
    const results: EncryptedSearchData[] = [];

    await Promise.all(
        contentIDs.map(async (itemID) => {
            try {
                const item = await decryptESItem({ esDB, indexKey, itemID });
                if (item) {
                    results.push(item);
                }
            } catch (error) {
                console.warn(`Failed to decrypt item ${itemID}:`, error);
            }
        })
    );

    return results;
};
