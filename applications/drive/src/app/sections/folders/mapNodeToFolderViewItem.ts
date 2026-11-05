import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getNodeEffectiveRoleFromHierarchy } from '@proton/drive/modules/nodes';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import { type NodeEntity, NodeType, splitNodeUid } from '@proton/drive/sdk';

import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getLegacyModifiedTime, getLegacyTrashedTime, legacyTimestampToDate } from '../../utils/sdk/legacyTime';
import type { FolderViewItem } from './useFolder.store';

// TODO: remove once we can use the Node directly without need for remapping
export const mapNodeToFolderViewItem = async (
    maybeNode: NodeEntity,
    defaultShareId: string,
    drive: Pick<ProtonDriveClient, 'getNodeHierarchy'>,
    loadedHierarchy?: NodeEntity[]
): Promise<FolderViewItem> => {
    const { node } = getNodeEntity(maybeNode);

    const hierarchy = loadedHierarchy ?? (await drive.getNodeHierarchy(node.uid));
    const rootNode = hierarchy[0];
    const size = getNodeDisplaySize(maybeNode) ?? 0;
    const sdkSignatureIssues = getSignatureIssues(maybeNode);
    const modificationTimestamp = getLegacyModifiedTime(node);

    const effectiveRole = getNodeEffectiveRoleFromHierarchy(hierarchy);

    return {
        uid: node.uid,
        name: node.name,
        id: node.uid,
        mimeType: node.mediaType ?? '',
        isFile: node.type === NodeType.File || node.type === NodeType.Photo,
        hasThumbnail: node.type === NodeType.File || node.type === NodeType.Photo,
        fileModifyTime: legacyTimestampToDate(modificationTimestamp),
        size,
        trashed: getLegacyTrashedTime(node),
        parentLinkId: node.parentUid ? splitNodeUid(node.parentUid).nodeId : '',
        linkId: splitNodeUid(node.uid).nodeId,
        volumeId: splitNodeUid(node.uid).volumeId,
        metaDataModifyTime: modificationTimestamp,
        activeRevisionUid: node.activeRevision?.uid,
        parentUid: node.parentUid,
        rootShareId: rootNode.deprecatedShareId || defaultShareId,
        rootUid: rootNode.uid,
        isShared: node.isShared,
        isSharedPublicly: node.isSharedByUrl,
        hasSignatureIssues: !sdkSignatureIssues.ok,
        type: node.type,
        effectiveRole,
    };
};
