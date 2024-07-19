import type { PrivateKeyReference, SessionKey } from '@proton/crypto';

import type { NodeMeta } from '../interface';

/**
 * Container for document keys.
 */
export type DocumentKeys = {
    documentContentKey: SessionKey;
    userAddressPrivateKey: PrivateKeyReference;
    userOwnAddress: string;
};

/**
 * Metadata for a document node.
 */
export type DocumentNodeMeta = NodeMeta & { keys: DocumentKeys };
