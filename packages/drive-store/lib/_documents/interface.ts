import { PrivateKeyReference, SessionKey } from '@proton/crypto';

import { NodeMeta } from '../interface';

/**
 * Container for general signed data.
 */
export type SignedData = {
    data: Uint8Array;
    hash: Uint8Array;
    signature: string;
    signatureAddress: string;
};

/**
 * Container for signed manifest.
 */
export type DocumentManifest = {
    manifest: Uint8Array;
    manifestSignature: string;
    signatureAddress: string;
};

/**
 * Container for document keys.
 */
export type DocumentKeys = {
    contentKey: SessionKey;
    signingKey: PrivateKeyReference;
    ownAddress: string;
};

/**
 * Metadata for a document node.
 */
export type DocumentNodeMeta = NodeMeta & { keys: DocumentKeys };
