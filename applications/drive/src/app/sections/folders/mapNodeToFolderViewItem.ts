import type { ProtonDriveClient } from '@proton/drive';
import { type MaybeNode, type NodeEntity, NodeType, splitNodeUid } from '@proton/drive';

import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getLegacyModifiedTime, getLegacyTrashedTime, legacyTimestampToDate } from '../../utils/sdk/legacyTime';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import type { FolderViewItem } from './useFolder.store';

// TODO: remove once we can use the Node directly without need for remapping
export const mapNodeToFolderViewItem = async (
    maybeNode: MaybeNode,
    defaultShareId: string,
    drive: Pick<ProtonDriveClient, 'getNode'>,
    loadedRootNode?: NodeEntity
): Promise<FolderViewItem> => {
    let node: NodeEntity;
    if ('ok' in maybeNode) {
        const nodeEntity = getNodeEntity(maybeNode);
        node = nodeEntity.node;
    } else {
        node = maybeNode;
    }

    const rootNode = loadedRootNode || (await getRootNode(node, drive));
    const size = getNodeDisplaySize(maybeNode) ?? 0;
    const sdkSignatureIssues = getSignatureIssues(maybeNode);
    const modificationTimestamp = getLegacyModifiedTime(node);

    const effectiveRole = await getNodeEffectiveRole(node, drive);

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
        isSharedPublicly: node.isSharedPublicly,
        hasSignatureIssues: !sdkSignatureIssues.ok,
        type: node.type,
        effectiveRole,
    };
};
