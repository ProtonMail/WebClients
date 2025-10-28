import { useShallow } from 'zustand/react/shallow';

import { useDownloadManagerStore } from '../../zustand/download/downloadManager.store';
import { useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';

export const useTransferManagerActions = () => {
    const { clearDownloads } = useDownloadManagerStore(
        useShallow((state) => {
            return {
                clearDownloads: state.clearQueue,
            };
        })
    );
    const { clearUploads } = useUploadQueueStore(
        useShallow((state) => {
            return {
                clearUploads: state.clearQueue,
            };
        })
    );

    const clearQueue = () => {
        clearDownloads();
        clearUploads();
    };

    return {
        clearQueue,
    };
};
