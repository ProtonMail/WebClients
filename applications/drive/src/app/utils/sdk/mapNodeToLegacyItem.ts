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
import type { EncryptedLink, LinkShareUrl } from '../../store';
import { getNodeDisplaySize } from './getNodeDisplaySize';
import { getNodeEntity } from './getNodeEntity';
import { getSignatureIssues } from './getSignatureIssues';
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
    hasSignatureIssues: boolean;
    signatureEmail?: string;
    /** @deprecated use storageSize instead */
    size: number;
    /** @description Storage size in bytes for the last revision of this entity (when the file is encrypted) */
    storageSize?: number;
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

    /** @deprecated use simply NodeType and remove this comment when photo is added in the enum */
    type: NodeType;
};

const getLegacyIsAnonymous = (node: NodeEntity) => {
    if (node.type === NodeType.Folder) {
        return node.keyAuthor.ok && node.keyAuthor.value === null;
    }
    return node.activeRevision?.contentAuthor.ok && node.activeRevision.contentAuthor.value === null;
};

export const getRootNode = async (node: NodeEntity, drive: Pick<ProtonDriveClient, 'getNode'>): Promise<NodeEntity> => {
    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        const { node: parentNode } = getNodeEntity(parent);
        return getRootNode(parentNode, drive);
    }

    return node;
};

export const mapNodeToLegacyItem = async (
    maybeNode: MaybeNode,
    defaultShareId: string,
    drive: Pick<ProtonDriveClient, 'getNode'> = getDrive(),
    loadedRootNode?: NodeEntity
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
    const rootNode = loadedRootNode || (await getRootNode(node, drive));
    const size = getNodeDisplaySize(maybeNode) ?? 0;
    if (nodeRevision) {
        activeRevision = {
            id: splitNodeRevisionUid(nodeRevision.uid).revisionId,
            createTime: dateToLegacyTimestamp(nodeRevision.creationTime),
            size,
            state: nodeRevision.state === RevisionState.Active ? 1 : 0,
            manifestSignature: '',
            blocs: [],
            thumbnails: [],
        };
    }

    const sdkSignatureIssues = getSignatureIssues(maybeNode);

    return {
        uid: node.uid,
        name: node.name,
        id: node.uid,
        mimeType: node.mediaType ?? '',
        isFile: node.type === NodeType.File || node.type === NodeType.Photo,
        hasThumbnail: node.type === NodeType.File || node.type === NodeType.Photo,
        fileModifyTime: getLegacyModifiedTime(node),
        size,
        storageSize: node.activeRevision?.storageSize ?? 0,
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
        hasSignatureIssues: !sdkSignatureIssues.ok,
        type: node.type,
    };
};
