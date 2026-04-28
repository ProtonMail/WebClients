import type { MaybeNode } from '@proton/drive';
import { parseAdditionalMetadata } from '@proton/drive';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import type { PhotoItem } from '../../usePhotos.store';

export const mapNodeToPhotoItem = (maybeNode: MaybeNode): PhotoItem | null => {
    const { node, photoAttributes } = getNodeEntity(maybeNode);
    if (!photoAttributes) {
        return null;
    }

    const signatureResult = getSignatureIssues(maybeNode);
    const parsedClaimedAdditionalMetadata = node.activeRevision?.claimedAdditionalMetadata
        ? parseAdditionalMetadata(node.activeRevision.claimedAdditionalMetadata)
        : undefined;

    return {
        nodeUid: node.uid,
        captureTime: photoAttributes.captureTime,
        tags: photoAttributes.tags,
        relatedPhotoNodeUids: photoAttributes.relatedPhotoNodeUids,
        additionalInfo: {
            name: node.name,
            mediaType: node.mediaType,
            isShared: node.isShared,
            duration: parsedClaimedAdditionalMetadata?.media?.duration,
            haveSignatureIssues: !signatureResult.ok,
            parentNodeUid: node.parentUid,
            activeRevisionUid: node.activeRevision?.uid,
            deprecatedShareId: node.deprecatedShareId,
        },
    };
};
