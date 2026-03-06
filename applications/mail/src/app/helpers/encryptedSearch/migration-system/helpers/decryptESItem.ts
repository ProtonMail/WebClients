import type { IDBPDatabase } from 'idb';

import { decryptFromDB } from '@proton/encrypted-search/esHelpers';
import type { EncryptedSearchDB } from '@proton/encrypted-search/models';

import type { ESMessageContent } from 'proton-mail/models/encryptedSearch';

interface DecryptESItemProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    itemID: string;
}

/**
 * Decrypt the content and metadata of the itemID
 */
export const decryptESItem = async ({
    esDB,
    indexKey,
    itemID,
}: DecryptESItemProps): Promise<ESMessageContent | undefined> => {
    const content = await esDB.get('content', itemID).then((encryptedContent) =>
        encryptedContent
            ? decryptFromDB<ESMessageContent>({
                  aesGcmCiphertext: encryptedContent,
                  indexKey,
                  source: 'readContentItem',
              })
            : undefined
    );

    return content;
};
