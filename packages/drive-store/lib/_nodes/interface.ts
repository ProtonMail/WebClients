import { DecryptedLink } from '../../store';

/**
 * A decrypted node in the Drive structure.
 */
export type DecryptedNode = {
    volumeId: string;
    nodeId: DecryptedLink['linkId'];
    parentNodeId: DecryptedLink['parentLinkId'];
    name: DecryptedLink['name'];
    hash: DecryptedLink['hash'];
    createTime: DecryptedLink['createTime'];
    mimeType: DecryptedLink['mimeType'];

    signatureAddress?: DecryptedLink['signatureAddress'];
    nameSignatureAddress?: DecryptedLink['nameSignatureAddress'];

    /**
     * If present, this node's metadata could be corrupted / undecryptable in some way.
     */
    isCorruptedNode?: DecryptedLink['corruptedLink'];
};
