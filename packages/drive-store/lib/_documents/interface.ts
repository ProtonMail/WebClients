import { SessionKey } from '@proton/crypto';

import { DecryptedLink } from '../../store';
import { NodeMeta } from '../interface';

/**
 * Container for a document's manifest and signature.
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
};

/**
 * Metadata for a document node.
 */
export type DocumentNodeMeta = NodeMeta & DocumentKeys;

/**
 * Document node.
 */

export type DocumentNode = {
    nodeId: DecryptedLink['linkId'];
    parentNodeId: DecryptedLink['parentLinkId'];
    name: DecryptedLink['name'];
    hash: DecryptedLink['hash'];
    createTime: DecryptedLink['createTime'];

    signatureAddress?: DecryptedLink['signatureAddress'];
    nameSignatureAddress?: DecryptedLink['nameSignatureAddress'];

    /**
     * If present, this node's metadata could be corrupted / undecryptable in some way.
     */
    isCorruptedNode?: DecryptedLink['corruptedLink'];
};
