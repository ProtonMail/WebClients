import { useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import { DownloadDriveClientRegistry } from '../DownloadDriveClientRegistry';

export const getDownloadSdk = (downloadId: string) => {
    const { getQueueItem } = useDownloadManagerStore.getState();
    const queueItem = getQueueItem(downloadId);
    return queueItem?.isPhoto
        ? DownloadDriveClientRegistry.getDrivePhotosClient()
        : DownloadDriveClientRegistry.getDriveClient();
};
