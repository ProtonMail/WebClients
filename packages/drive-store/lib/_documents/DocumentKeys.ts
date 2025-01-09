import type { PrivateKeyReference, SessionKey } from '@proton/crypto/lib';

/**
 * Container for document keys.
 */
export type DocumentKeys = {
    documentContentKey: SessionKey;
    userAddressPrivateKey: PrivateKeyReference;
    userOwnAddress: string;
};

/** If the user is signed in while viewing a public link, the user info will be populated, otherwise it will be undefined */
export type PublicDocumentKeys = {
    documentContentKey: SessionKey;
    userAddressPrivateKey?: PrivateKeyReference;
    userOwnAddress?: string;
};
