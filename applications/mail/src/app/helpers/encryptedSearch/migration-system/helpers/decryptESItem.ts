import { decryptFromDB } from '@proton/encrypted-search/esHelpers';
import type { ESCiphertext } from '@proton/encrypted-search/models';

import type { ESMessageContent } from 'proton-mail/models/encryptedSearch';

interface DecryptESItemProps {
    indexKey: CryptoKey;
    cipher: ESCiphertext;
}

/**
 * Decrypt the content and metadata of the itemID
 */
export const decryptESItem = async ({ indexKey, cipher }: DecryptESItemProps): Promise<ESMessageContent> => {
    return decryptFromDB<ESMessageContent>({
        aesGcmCiphertext: cipher,
        indexKey,
        source: 'readContentItem',
    });
};
