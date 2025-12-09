import type { NodeEntity } from '@proton/drive/index';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';

import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { DownloadStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import { getNodeStorageSize } from './getNodeStorageSize';

export function handleError(error: unknown, downloadId: string, nodes: NodeEntity[]) {
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
