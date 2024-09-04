import type { DecryptedLink } from '../../store';
import type { DecryptedNode } from './interface';

/**
 * Converts a Drive store object to a DecryptedNode.
 */
export const decryptedLinkToNode = (link: DecryptedLink, volumeId: string): DecryptedNode => {
    return {
        volumeId,
        nodeId: link.linkId,
        parentNodeId: link.parentLinkId,

        name: link.name,
        hash: link.hash,
        createTime: link.createTime,
        mimeType: link.mimeType,
        signatureAddress: link.signatureAddress,
        nameSignatureAddress: link.nameSignatureAddress,
        isCorruptedNode: link.corruptedLink,
        trashed: link.trashed,
        trashedByParent: link.trashedByParent,
    } satisfies DecryptedNode;
};
