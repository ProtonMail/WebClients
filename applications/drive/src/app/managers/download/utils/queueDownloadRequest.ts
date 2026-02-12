import { type NodeEntity, NodeType } from '@proton/drive';

import { DownloadStatus, IssueStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import type { DownloadOptions } from '../downloadTypes';
import { getNodeStorageSize } from './getNodeStorageSize';

type QueueDownloadRequestParams = DownloadOptions & {
    nodes: NodeEntity[];
    isPhoto: boolean;
    containsUnsupportedFile?: boolean;
    requestedDownloads: Map<string, NodeEntity[]>;
    scheduleSingleFile: (downloadId: string, node: NodeEntity) => void;
    scheduleArchive: (downloadId: string, nodes: NodeEntity[]) => void;
    getArchiveName: (nodes: NodeEntity[]) => string;
};

export function queueFailedDownloadRequest({
    nodes,
    requestedDownloads,
}: {
    nodes: NodeEntity[];
    requestedDownloads: Map<string, NodeEntity[]>;
}): string | undefined {
    if (!nodes.length) {
        return undefined;
    }
    const { addDownloadItem } = useDownloadManagerStore.getState();

    const node = nodes[0];
    const downloadId = addDownloadItem({
        name: node.name,
        storageSize: getNodeStorageSize(node),
        downloadedBytes: 0,
        status: DownloadStatus.Failed,
        nodeUids: [node.uid],
    });
    requestedDownloads.set(downloadId, nodes);
    return downloadId;
}

export function queueDownloadRequest({
    nodes,
    isPhoto,
    containsUnsupportedFile,
    albumName,
    revisionUid,
    requestedDownloads,
    scheduleSingleFile,
    scheduleArchive,
    getArchiveName,
    shouldScanForMalware,
    skipSignatureCheck,
}: QueueDownloadRequestParams): string | undefined {
    if (!nodes.length) {
        return undefined;
    }

    const targetType = isPhoto ? NodeType.Photo : NodeType.File;
    const isSingleFileDownload = nodes.length === 1 && nodes[0].type === targetType;
    const unsupportedStatus = containsUnsupportedFile ? IssueStatus.Detected : undefined;
    const signatureIssueAllDecision = skipSignatureCheck ? IssueStatus.Approved : undefined;
    const { addDownloadItem } = useDownloadManagerStore.getState();

    if (isSingleFileDownload) {
        if (unsupportedStatus) {
            return undefined;
        }
        const node = nodes[0];
        const downloadId = addDownloadItem({
            name: node.name,
            storageSize: getNodeStorageSize(node),
            downloadedBytes: 0,
            status: DownloadStatus.Pending,
            nodeUids: [node.uid],
            revisionUid,
            unsupportedFileDetected: unsupportedStatus,
            isPhoto,
            shouldScanForMalware,
            signatureIssueAllDecision,
        });
        requestedDownloads.set(downloadId, nodes);
        void scheduleSingleFile(downloadId, node);
        return downloadId;
    }

    const archiveName = isPhoto && albumName ? `${albumName}.zip` : getArchiveName(nodes);
    const downloadId = addDownloadItem({
        name: archiveName,
        storageSize: undefined,
        downloadedBytes: 0,
        status: DownloadStatus.Pending,
        nodeUids: nodes.map(({ uid }) => uid),
        unsupportedFileDetected: unsupportedStatus,
        isPhoto,
        shouldScanForMalware,
        signatureIssueAllDecision,
    });
    requestedDownloads.set(downloadId, nodes);
    void scheduleArchive(downloadId, nodes);
    return downloadId;
}
