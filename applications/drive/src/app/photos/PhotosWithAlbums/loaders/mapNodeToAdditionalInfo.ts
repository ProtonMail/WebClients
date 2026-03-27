import type { MaybeNode } from '@proton/drive';
import { parseAdditionalMetadata } from '@proton/drive';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import type { PhotoAdditionalInfo } from '../../usePhotos.store';

export const mapNodeToAdditionalInfo = (maybeNode: MaybeNode): { uid: string; additionalInfo: PhotoAdditionalInfo } => {
    const { node } = getNodeEntity(maybeNode);
    const signatureResult = getSignatureIssues(maybeNode);
    const parsedClaimedAdditionalMetadata = node.activeRevision?.claimedAdditionalMetadata
        ? parseAdditionalMetadata(node.activeRevision.claimedAdditionalMetadata)
        : undefined;

    return {
        uid: node.uid,
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
