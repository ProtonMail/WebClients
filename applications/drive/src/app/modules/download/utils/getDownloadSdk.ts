import { DownloadDriveClientRegistry } from '../DownloadDriveClientRegistry';
import { useDownloadManagerStore } from '../downloadManager.store';

export const getDownloadSdk = (downloadId: string) => {
    const { getQueueItem } = useDownloadManagerStore.getState();
    const queueItem = getQueueItem(downloadId);
    return queueItem?.isPhoto
        ? DownloadDriveClientRegistry.getDrivePhotosClient()
        : DownloadDriveClientRegistry.getDriveClient();
};
