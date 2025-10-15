import type { ProtonDriveClient } from '@proton/drive';
import {
    type MaybeNode,
    type NodeEntity,
    NodeType,
    RevisionState,
    getDrive,
    splitNodeRevisionUid,
    splitNodeUid,
} from '@proton/drive';

import type { FileBrowserBaseItem } from '../../components/FileBrowser';
import type { EncryptedLink, LinkShareUrl, SignatureIssues } from '../../store';
import { getNodeEntity } from './getNodeEntity';
import { dateToLegacyTimestamp, getLegacyModifiedTime, getLegacyTrashedTime } from './legacyTime';

export type LegacyItem = FileBrowserBaseItem & {
    uid: string;
    name: string;
    shareId?: string;
    volumeId: string;
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail: boolean;
    isFile: boolean;
    mimeType: string;
    fileModifyTime: number;
    shareUrl?: LinkShareUrl;
    signatureIssues?: SignatureIssues;
    signatureEmail?: string;
    size: number;
    trashed: number | null;
    parentLinkId: string;
    sharedOn?: number;
    isLegacy?: boolean;
    metaDataModifyTime: number;
    isLocked?: boolean;
    thumbnailId: string;
    isShared?: boolean;
    isSharedPublicly?: boolean;
    parentUid: string | undefined;
    deprecatedShareId?: string;
    rootUid?: string;
    /**
     * FILEBROWSER TODO:
     * @todo rootShareId is only needed here until we migrate to the new File Browser
     * After that, we can simply call getRootShareId when needed (like for preview/navigation)
     */
    rootShareId: string;
    /**
     * FILEBROWSER TODO:
     * @todo id is only ever needed for FileBrowser, specifically item selection that has the `id` property hardcoded
     */
    id: string;
    directShare?: {
        sharedOn: number;
        sharedBy: string;
    };
    treeEventScopeId?: string;
};

const getLegacyIsAnonymous = (node: NodeEntity) => {
    if (node.type === NodeType.Folder) {
        return node.keyAuthor.ok && node.keyAuthor.value === null;
    }
    return node.activeRevision?.contentAuthor.ok && node.activeRevision.contentAuthor.value === null;
};

// totalStorageSize is the sum of the sizes of all revisions, so it's not the size of the single file
// Because of this we want to get the file size from the active revision and we use totalStorageSize only as a fallback
// For proton docs or spreadsheets we get the revision size empty and we will instead read totalStorageSize
export const getNodeDisplaySize = (node: NodeEntity) =>
    node.activeRevision?.claimedSize ?? node.activeRevision?.storageSize ?? node.totalStorageSize ?? 0;

export const getRootNode = async (node: NodeEntity, drive: ProtonDriveClient): Promise<NodeEntity> => {
    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        const { node: parentNode } = getNodeEntity(parent);
        return getRootNode(parentNode, drive);
    }

    return node;
};

export const mapNodeToLegacyItem = async (
    maybeNode: MaybeNode | NodeEntity,
    defaultShareId: string,
    drive: ProtonDriveClient = getDrive()
): Promise<LegacyItem> => {
    let node: NodeEntity;
    if ('ok' in maybeNode) {
        const nodeEntity = getNodeEntity(maybeNode);
        node = nodeEntity.node;
    } else {
        node = maybeNode;
    }

    let activeRevision;
    const nodeRevision = node.activeRevision;
    const rootNode = await getRootNode(node, drive);
    if (nodeRevision) {
        activeRevision = {
            id: splitNodeRevisionUid(nodeRevision.uid).revisionId,
            createTime: dateToLegacyTimestamp(nodeRevision.creationTime),
            size: getNodeDisplaySize(node),
            state: nodeRevision.state === RevisionState.Active ? 1 : 0,
            manifestSignature: '',
            blocs: [],
            thumbnails: [],
        };
    }

    return {
        uid: node.uid,
        name: node.name,
        id: node.uid,
        mimeType: node.mediaType ?? '',
        isFile: node.type === NodeType.File,
        hasThumbnail: node.type === NodeType.File,
        fileModifyTime: getLegacyModifiedTime(node),
        size: getNodeDisplaySize(node),
        trashed: getLegacyTrashedTime(node),
        parentLinkId: node.parentUid ? splitNodeUid(node.parentUid).nodeId : '',
        linkId: splitNodeUid(node.uid).nodeId,
        volumeId: splitNodeUid(node.uid).volumeId,
        metaDataModifyTime: getLegacyModifiedTime(node),
        isLocked: false,
        activeRevision,
        isAnonymous: getLegacyIsAnonymous(node),
        thumbnailId: activeRevision?.id || node.uid,
        parentUid: node.parentUid,
        deprecatedShareId: node.deprecatedShareId,
        shareId: node.deprecatedShareId || defaultShareId,
        rootShareId: rootNode.deprecatedShareId || defaultShareId,
        rootUid: rootNode.uid,
        isShared: node.isShared,
        isSharedPublicly: node.isSharedPublicly,
        treeEventScopeId: node.treeEventScopeId,
    };
};
