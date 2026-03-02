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
    const [metadataResult, content] = await Promise.all([
        esDB.get('metadata', itemID).then(async (encryptedMetadata) => {
            if (!encryptedMetadata) {
                return undefined;
            }

            const decrypted = await decryptFromDB<ESBaseMessage>({
                aesGcmCiphertext: encryptedMetadata.aesGcmCiphertext,
                indexKey,
                source: 'readMetadataItem',
            });
            return { decrypted, timepoint: encryptedMetadata.timepoint };
        }),
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

    const metadata = metadataResult?.decrypted;

    if (!metadata && !content) {
        return undefined;
    }

    return { metadata, content, timepoint: metadataResult?.timepoint };
};
