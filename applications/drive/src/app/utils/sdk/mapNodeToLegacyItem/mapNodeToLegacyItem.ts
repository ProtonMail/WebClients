import {
    type MaybeNode,
    type NodeEntity,
    NodeType,
    RevisionState,
    splitNodeRevisionUid,
    splitNodeUid,
} from '@proton/drive/index';

import { type FileBrowserBaseItem } from '../../../components/FileBrowser';
import type { EncryptedLink, LinkShareUrl, ShareWithKey, SignatureIssues } from '../../../store';
import { getNodeEntity } from '../getNodeEntity';

export type LegacyItem = FileBrowserBaseItem & {
    uid: string;
    name: string;
    shareId: string;
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
    rootShareId: string;
    sharedOn?: number;
    isLegacy?: boolean;
};

const dateToLegacyTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);

const getLegacyModifiedTime = (node: NodeEntity) => {
    let date = node.activeRevision?.claimedModificationTime
        ? node.activeRevision.claimedModificationTime
        : node.creationTime;

    return dateToLegacyTimestamp(date);
};

const getLegacyTrashedTime = (node: NodeEntity) => (node.trashTime ? dateToLegacyTimestamp(node.trashTime) : null);

// totalStorageSize is the sum of the sizes of all revisions, so it's not the size of the single file
// Because of this we want to get the file size from the active revision and we use totalStorageSize only as a fallback
// For proton docs or spreadsheets we get the revision size empty and we will instead read totalStorageSize
const getLegacySize = (node: NodeEntity) =>
    node.activeRevision?.claimedSize || node.activeRevision?.storageSize || node.totalStorageSize || 0;

export const mapNodeToLegacyItem = async (maybeNode: MaybeNode, defaultShare: ShareWithKey): Promise<LegacyItem> => {
    let { node } = getNodeEntity(maybeNode);
    let activeRevision;
    const nodeRevision = node.activeRevision;
    if (nodeRevision) {
        activeRevision = {
            id: splitNodeRevisionUid(nodeRevision.uid).revisionId,
            createTime: dateToLegacyTimestamp(nodeRevision.creationTime),
            size: nodeRevision.storageSize,
            state: nodeRevision.state === RevisionState.Active ? 1 : 0,
            manifestSignature: '',
            blocs: [],
            thumbnails: [],
        };
    }

    return {
        uid: node.uid,
        name: node.name,
        shareId: node.deprecatedShareId || defaultShare.shareId,
        id: splitNodeUid(node.uid).nodeId,
        mimeType: node.mediaType ?? '',
        isFile: node.type === NodeType.File,
        rootShareId: defaultShare.shareId,
        hasThumbnail: true,
        fileModifyTime: getLegacyModifiedTime(node),
        size: getLegacySize(node),
        trashed: getLegacyTrashedTime(node),
        parentLinkId: splitNodeUid(node.parentUid!).nodeId,
        linkId: splitNodeUid(node.uid).nodeId,
        volumeId: splitNodeUid(node.uid).volumeId,
        activeRevision,
    };
};
