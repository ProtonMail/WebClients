import type { MaybeNode } from '@proton/drive';
import { getDriveForPhotos, parseAdditionalMetadata } from '@proton/drive';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { isMissingNode } from '../../utils/sdk/node';
import type { PhotoItem } from '../usePhotos.store';

export const createPhotoItemsFromNode = async (nodeUids: string[]): Promise<PhotoItem[] | null> => {
    const drive = await getDriveForPhotos();
    const photoItems = [];
    try {
        for await (const maybeMissingNode of drive.iterateNodes(nodeUids)) {
            if (isMissingNode(maybeMissingNode)) {
                continue;
            }
            const maybeNode = maybeMissingNode satisfies MaybeNode;
            const { node, photoAttributes } = getNodeEntity(maybeNode);
            if (!photoAttributes) {
                continue;
            }

            const signatureResult = getSignatureIssues(maybeNode);
            const claimedAdditionalMetadata = node.activeRevision?.claimedAdditionalMetadata;
            const parsedMetadata = claimedAdditionalMetadata
                ? parseAdditionalMetadata(claimedAdditionalMetadata)
                : undefined;

            photoItems.push({
                nodeUid: node.uid,
                captureTime: photoAttributes.captureTime,
                tags: photoAttributes.tags,
                relatedPhotoNodeUids: photoAttributes.relatedPhotoNodeUids,
                additionalInfo: {
                    name: node.name,
                    mediaType: node.mediaType,
                    duration: parsedMetadata?.media?.duration,
                    haveSignatureIssues: !signatureResult.ok,
                    isShared: node.isShared,
                    parentNodeUid: node.parentUid,
                    activeRevisionUid: node.activeRevision?.uid,
                    deprecatedShareId: node.deprecatedShareId,
                },
            });
        }
    } catch (error) {
        handleSdkError(error, { showNotification: false });
        return null;
    }
    return photoItems;
};
