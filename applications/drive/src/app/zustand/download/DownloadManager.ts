import generateUID from '@proton/utils/generateUID';

import { DownloadStatus, MalawareDownloadResolution, useDownloadManagerStore } from './downloadManager.store';

// TODO: only has basic store interactions, actual download logic needs to be implemented

export class DownloadManager {
    private static instance: DownloadManager | undefined;

    static getInstance(): DownloadManager {
        if (!DownloadManager.instance) {
            DownloadManager.instance = new DownloadManager();
        }

        return DownloadManager.instance;
    }

    onIntegrityIssue(downloadId: string) {
        console.warn('onIntegrityIssue not implemented', downloadId);
    }

    async download(nodes: { uid: string; name: string }[]) {
        if (!nodes.length) {
            return;
        }

        const { addDownloadItem } = useDownloadManagerStore.getState();

        nodes.forEach(({ uid, name }) => {
            addDownloadItem({
                downloadId: generateUID(),
                name,
                encryptedSize: 0, // TODO
                progress: 0,
                status: DownloadStatus.Downloading,
                nodeUids: [uid], // more likely this will contain all nodes.uid
            });
        });
    }

    resolveMalwareDetection(downloadId: string, resolution: MalawareDownloadResolution) {
        if (resolution === MalawareDownloadResolution.CancelDownload) {
            this.cancel([downloadId]);
        }
        if (resolution === MalawareDownloadResolution.ContinueDownload) {
            this.resume([downloadId]);
        }
    }

    pause(downloadIds?: string[]) {
        if (downloadIds) {
            this.stopDownload(downloadIds);
            this.updateStatus(downloadIds, DownloadStatus.Paused);
        }
    }

    resume(downloadIds?: string[]) {
        if (downloadIds) {
            this.updateStatus(downloadIds, DownloadStatus.Downloading);
        }
    }

    cancel(downloadIds?: string[]) {
        if (downloadIds) {
            this.stopDownload(downloadIds);
            this.updateStatus(downloadIds, DownloadStatus.Cancelled);
        }
    }

    async clear() {
        const { clearQueue, queue } = useDownloadManagerStore.getState();
        try {
            await this.stopDownload(Array.from(queue.keys()));
            clearQueue(); // Clearing should be tied to stopping all downloads
        } catch (e) {
            console.warn('unable to clear all downloads');
        }
    }

    private async stopDownload(downloadIds?: string[]) {
        console.warn('stopDownload not implemented', downloadIds);
    }

    private updateStatus(downloadIds: string[], status: DownloadStatus) {
        if (!downloadIds.length) {
            return;
        }
        const { updateDownloadItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => updateDownloadItem(id, { status }));
    }
}

export const downloadManager = DownloadManager.getInstance();
