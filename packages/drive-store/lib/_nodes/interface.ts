import type { DecryptedLink } from '../../store';

/**
 * A decrypted node in the Drive structure.
 */
export type DecryptedNode = {
    volumeId: string;
    nodeId: DecryptedLink['linkId'];
    /**
     * A node may not always have a parent.
     *
     * For example, when direct sharing a node, the invitee
     * does not have access to the parent.
     */
    parentNodeId?: DecryptedLink['parentLinkId'];
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
    trashed?: DecryptedLink['trashed'];
    trashedByParent?: DecryptedLink['trashedByParent'];
};
