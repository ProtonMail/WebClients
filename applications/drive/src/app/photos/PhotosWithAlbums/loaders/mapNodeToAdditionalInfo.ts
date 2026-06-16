import type { NodeEntity } from '@proton/drive';
import { parseAdditionalMetadata } from '@proton/drive';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';

import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import type { PhotoItem } from '../../usePhotos.store';

export const mapNodeToPhotoItem = (nodeEntityRaw: NodeEntity): PhotoItem | null => {
    const { node, photoAttributes } = getNodeEntity(nodeEntityRaw);
    if (!photoAttributes) {
        return null;
    }

    const signatureResult = getSignatureIssues(nodeEntityRaw);
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
