import { decryptFromDB } from '@proton/encrypted-search/esHelpers';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch';

import type { DBType, EncryptedSearchData } from '../interface';

interface DecryptESItemProps {
    esDB: DBType;
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
}: DecryptESItemProps): Promise<EncryptedSearchData | undefined> => {
    const [metadata, content] = await Promise.all([
        esDB.get('metadata', itemID).then((encryptedMetadata) =>
            encryptedMetadata
                ? decryptFromDB<ESBaseMessage>({
                      aesGcmCiphertext: encryptedMetadata.aesGcmCiphertext,
                      indexKey,
                      source: 'readMetadataItem',
                  })
                : undefined
        ),
        esDB.get('content', itemID).then((encryptedContent) =>
            encryptedContent
                ? decryptFromDB<ESMessageContent>({
                      aesGcmCiphertext: encryptedContent,
                      indexKey,
                      source: 'readContentItem',
                  })
                : undefined
        ),
    ]);

    if (!metadata && !content) {
        return undefined;
    }

    return { metadata, content };
};
