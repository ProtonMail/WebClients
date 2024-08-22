import { useState } from 'react';

import metrics from '@proton/metrics';

import { TransferState } from '../../../components/TransferManager/transfer';
import { MetricShareType } from '../../../utils/type/MetricShareType';
import useSharesState from '../../_shares/useSharesState';
import { getShareType } from '../../_uploads/UploadProvider/useUploadMetrics';
import type { Download } from './interface';

export const useDownloadMetrics = () => {
    const { getShare } = useSharesState();
    const [processed, setProcessed] = useState<Set<string>>(new Set());

    const getShareIdType = (shareId: string): MetricShareType => {
        const share = getShare(shareId);
        return getShareType(share);
    };

    const getKey = (downloadId: string, shareId: string) => `${downloadId}-${shareId}`;

    const observe = (downloads: Download[]) => {
        for (const download of downloads) {
            if (download.state === TransferState.Done || download.state === TransferState.Error) {
                download.links.forEach((link) => {
                    const key = getKey(download.id, link.shareId);
                    if (!processed.has(key)) {
                        const shareType = getShareIdType(link.shareId);
                        metrics.drive_download_success_rate_total.increment({
                            status: download.state === TransferState.Done ? 'success' : 'failure',
                            retry: 'false',
                            shareType: shareType === MetricShareType.Own ? 'main' : shareType,
                        });
                        setProcessed((prev) => new Set(prev.add(key)));
                    }
                });
            }
        }
    };

    return {
        observe,
    };
};
