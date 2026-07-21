import { type ESCiphertext, type IndexKey, decryptItem } from '@protontech/crypto/subtle/ad-hoc/encryptedSearch.ts';

import { ESDecryptionError, ESParseError } from '../models/errors';
import { esSentryReport } from './esReporting';

/**
 * Decrypt encrypted object from IndexedDB
 */
export const decryptFromDB = async <Plaintext>({
    aesGcmCiphertext,
    indexKey,
    source,
}: {
    aesGcmCiphertext: ESCiphertext;
    indexKey: IndexKey;
    source: 'uncachedSearch' | 'cacheIDB' | 'readMetadataItem' | 'readContentItem' | 'searchUndecryptedElements';
}): Promise<Plaintext> => {
    try {
        const textDecoder = new TextDecoder();

        const serializedItem = await decryptItem(indexKey, aesGcmCiphertext);

        const decodedText = textDecoder.decode(serializedItem);

        try {
            return JSON.parse(decodedText);
        } catch (error) {
            const parseError = new ESParseError('Failed to parse decrypted data', error as Error);
            esSentryReport(`${parseError.message}: decryptFromDB`, {
                source,
                length: decodedText.length,
                error: parseError,
            });
            throw parseError;
        }
    } catch (error) {
        if (error instanceof ESParseError) {
            throw error;
        }

        const decryptError = new ESDecryptionError('Failed to decrypt data', error as Error);
        esSentryReport(`${decryptError.message}: decryptFromDB`, { source, error: decryptError });
        throw decryptError;
    }
};
