import { getDrive, getDriveForPhotos } from '@proton/drive/index';

import { useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';

export const getDownloadSdk = (downloadId: string) => {
    const { getQueueItem } = useDownloadManagerStore.getState();
    const drive = getQueueItem(downloadId)?.isPhoto ? getDriveForPhotos() : getDrive();
    return drive;
};
