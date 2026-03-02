import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

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
                traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
            }
        })
    );

    return results;
};
