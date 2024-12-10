import type { PrivateKeyReference, SessionKey } from '@proton/crypto/lib';

/**
 * Container for document keys.
 */
export type DocumentKeys = {
    documentContentKey: SessionKey;
    userAddressPrivateKey: PrivateKeyReference;
    userOwnAddress: string;
};
