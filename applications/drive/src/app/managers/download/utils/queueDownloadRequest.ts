import { type NodeEntity, NodeType } from '@proton/drive/index';

import { type DownloadItemInput, DownloadStatus, IssueStatus } from '../../../zustand/download/downloadManager.store';
import { getNodeStorageSize } from './getNodeStorageSize';

type QueueDownloadRequestParams = {
    nodes: NodeEntity[];
    isPhoto: boolean;
    containsUnsupportedFile?: boolean;
    albumName?: string;
    addDownloadItem: (item: DownloadItemInput) => string;
    requestedDownloads: Map<string, NodeEntity[]>;
    scheduleSingleFile: (downloadId: string, node: NodeEntity) => void;
    scheduleArchive: (downloadId: string, nodes: NodeEntity[]) => void;
    getArchiveName: (nodes: NodeEntity[]) => string;
};

export function queueDownloadRequest({
    nodes,
    isPhoto,
    containsUnsupportedFile,
    albumName,
    addDownloadItem,
    requestedDownloads,
    scheduleSingleFile,
    scheduleArchive,
    getArchiveName,
}: QueueDownloadRequestParams): string | undefined {
    if (!nodes.length) {
        return undefined;
    }

    const targetType = isPhoto ? NodeType.Photo : NodeType.File;
    const isSingleFileDownload = nodes.length === 1 && nodes[0].type === targetType;
    const unsupportedStatus = containsUnsupportedFile ? IssueStatus.Detected : undefined;

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
            unsupportedFileDetected: unsupportedStatus,
            isPhoto,
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
    });
    requestedDownloads.set(downloadId, nodes);
    void scheduleArchive(downloadId, nodes);
    return downloadId;
}
