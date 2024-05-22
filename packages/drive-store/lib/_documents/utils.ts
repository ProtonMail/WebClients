import { DecryptedLink } from '../../store';
import { DocumentNode } from './interface';

/**
 * Converts a Drive store object to a DocumentNode.
 *
 * Currently the same for simplicity but we may choose to omit certain properties in the future.
 */
export const linkToDocumentNode = (link: DecryptedLink): DocumentNode => {
    return {
        nodeId: link.linkId,
        parentNodeId: link.parentLinkId,
        name: link.name,
        hash: link.hash,
        createTime: link.createTime,
        signatureAddress: link.signatureAddress,
        nameSignatureAddress: link.nameSignatureAddress,
        isCorruptedNode: link.corruptedLink,
    } satisfies DocumentNode;
};
