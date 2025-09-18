import { useMemo } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useDownloadManagerStore } from '../../zustand/download/downloadManager.store';
import { useUploadManagerStore } from '../../zustand/upload/uploadManager.store';
import { TransferList, type TransferListItem } from './TransferList';

export const TransferManager = () => {
    const downloadQueue = useDownloadManagerStore(useShallow((state) => state.getQueue()));
    const uploadQueue = useUploadManagerStore(useShallow((state) => state.getQueue()));

    const downloadItems = useMemo<TransferListItem[]>(
        () =>
            downloadQueue.map((item) => ({
                id: item.downloadId,
                name: item.name,
                status: item.status,
                progress: item.progress,
            })),
        [downloadQueue]
    );

    const uploadItems = useMemo<TransferListItem[]>(
        () =>
            uploadQueue.map((item) => ({
                id: item.uploadId,
                name: item.name,
                status: item.status,
                progress: item.progress,
            })),
        [uploadQueue]
    );

    const hasTransfers = downloadItems.length > 0 || uploadItems.length > 0;

    // This view implementation is a placeholder, we will need to either implement or replicate the style of
    // applications/drive/src/app/components/TransferManager/TransferManager.tsx
    return (
        <section aria-label={c('Label').t`File transfer overview`}>
            <h2>{c('Title').t`Transfer manager`}</h2>
            {!hasTransfers ? (
                <p>{c('Info').t`No active transfers.`}</p>
            ) : (
                <div>
                    <TransferList
                        title={c('Label').t`Downloads`}
                        emptyMessage={c('Info').t`No downloads in queue.`}
                        items={downloadItems}
                    />
                    <TransferList
                        title={c('Label').t`Uploads`}
                        emptyMessage={c('Info').t`No uploads in queue.`}
                        items={uploadItems}
                    />
                </div>
            )}
        </section>
    );
};
