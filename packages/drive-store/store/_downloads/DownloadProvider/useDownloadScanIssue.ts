import { TransferCancel, TransferState } from '../../../components/TransferManager/transfer';
import { waitUntil } from '../../../utils/async';
import type { Download, UpdateData, UpdateFilter, UpdateState } from './interface';

export default function useDownloadScanIssue(
    updateWithData: (filter: UpdateFilter, newState: UpdateState, data?: UpdateData) => void,
    cancelDownloads: (filter: UpdateFilter) => void
) {
    const handleScanIssue = (
        abortSignal: AbortSignal,
        download: Download,
        scanIssueError?: Error
    ): Promise<boolean> => {
        const getResponse = (): boolean => {
            return download.state !== TransferState.ScanIssue;
        };

        updateWithData(download.id, TransferState.ScanIssue, { scanIssueError });

        return new Promise((resolve, reject) => {
            waitUntil(() => getResponse(), abortSignal)
                .then(() => {
                    if (download.state === TransferState.Progress) {
                        resolve(true);
                    } else {
                        reject(new TransferCancel({ message: 'Download was canceled' }));
                    }
                })
                .catch(() => {
                    cancelDownloads(download.id);
                    reject(new TransferCancel({ message: 'Download was canceled' }));
                });
        });
    };

    return {
        handleScanIssue,
    };
}
