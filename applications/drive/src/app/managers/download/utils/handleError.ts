import { c } from 'ttag';

import type { NodeEntity } from '@proton/drive/index';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';

import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { getNodeStorageSize } from '../../../utils/sdk/getNodeStorageSize';
import { isTransferCancelError } from '../../../utils/transfer';
import { DownloadStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import { downloadLogDebug } from './downloadLogger';

function trackError(error: unknown, downloadId: string, nodes: NodeEntity[]) {
    const errorMessage = c('Info').t`Unexpected download error`;
    const { updateDownloadItem } = useDownloadManagerStore.getState();
    const errorToHandle = error instanceof Error ? error : new Error(errorMessage);
    updateDownloadItem(downloadId, { status: DownloadStatus.Failed, error: errorToHandle });

    sendErrorReport(
        new EnrichedError(errorToHandle.message, {
            tags: {
                component: 'download-manager',
            },
            extra: {
                filesTypes: nodes.map((f) => getFileExtension(f.name)),
                storageSize: nodes.reduce((acc, node) => getNodeStorageSize(node) + acc, 0),
            },
        })
    );
}

export function handleDownloadError(downloadId: string, nodes: NodeEntity[], error: unknown, aborted?: boolean) {
    const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();
    const isCancelled = Boolean(aborted) || isTransferCancelError(error);

    if (isCancelled) {
        const currentItem = getQueueItem(downloadId);
        // If retry() was called before this async callback fired, the download will have
        // isRetried:true and a non-terminal status. Don't overwrite it with Cancelled.
        if (
            currentItem?.isRetried &&
            currentItem.status !== DownloadStatus.Cancelled &&
            currentItem.status !== DownloadStatus.Failed
        ) {
            return;
        }
        updateDownloadItem(downloadId, { status: DownloadStatus.Cancelled, error: undefined });
    } else {
        downloadLogDebug('Download error', { downloadId, error });
        trackError(error, downloadId, nodes);
    }
}
