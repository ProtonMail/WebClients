import type { NodeEntity } from '@proton/drive/index';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';

import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { isTransferCancelError } from '../../../utils/transfer';
import { DownloadStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import { downloadLogDebug } from './downloadLogger';
import { getNodeStorageSize } from './getNodeStorageSize';

function trackError(error: unknown, downloadId: string, nodes: NodeEntity[]) {
    const { updateDownloadItem } = useDownloadManagerStore.getState();
    const errorToHandle = error instanceof Error ? error : new Error('Unexpected Download Error');
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
    const { updateDownloadItem } = useDownloadManagerStore.getState();
    const isCancelled = Boolean(aborted) || isTransferCancelError(error);

    if (isCancelled) {
        updateDownloadItem(downloadId, { status: DownloadStatus.Cancelled, error: undefined });
    } else {
        downloadLogDebug('Download error', { downloadId, error });
        trackError(error, downloadId, nodes);
    }
}
