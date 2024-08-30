import { useState } from 'react';

import metrics from '@proton/metrics';
import type { HttpsProtonMeDriveDownloadErrorsTotalV2SchemaJson } from '@proton/metrics/types/drive_download_errors_total_v2.schema';
import {
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { TransferState } from '../../../components/TransferManager/transfer';
import { is4xx, is5xx } from '../../../utils/errorHandling/apiErrors';
import type { DownloadErrorCategoryType } from '../../../utils/type/MetricTypes';
import { DownloadErrorCategory, MetricShareType } from '../../../utils/type/MetricTypes';
import useSharesState from '../../_shares/useSharesState';
import { getShareType } from '../../_uploads/UploadProvider/useUploadMetrics';
import type { Download } from './interface';

export function getErrorCategory(state: TransferState, error: any): DownloadErrorCategoryType {
    if (getIsUnreachableError(error) || getIsTimeoutError(error)) {
        return DownloadErrorCategory.ServerError;
    } else if (getIsOfflineError(error) || getIsNetworkError(error) || state === TransferState.NetworkError) {
        return DownloadErrorCategory.NetworkError;
    } else if (error?.statusCode && error?.statusCode === 429) {
        return DownloadErrorCategory.RateLimited;
    } else if (error?.statusCode && is4xx(error?.statusCode)) {
        return DownloadErrorCategory.HTTPClientError;
    } else if (error?.statusCode && is5xx(error?.statusCode)) {
        return DownloadErrorCategory.HTTPServerError;
    }
    return DownloadErrorCategory.Unknown;
}

export const useDownloadMetrics = (
    initiator: HttpsProtonMeDriveDownloadErrorsTotalV2SchemaJson['Labels']['initiator']
) => {
    const { getShare } = useSharesState();
    const [processed, setProcessed] = useState<Set<string>>(new Set());

    const getShareIdType = (shareId: string): MetricShareType => {
        const share = getShare(shareId);
        return getShareType(share);
    };

    const getKey = (downloadId: string, retries: number) => `${downloadId}-${retries}`;

    const logDownloadError = (shareType: MetricShareType, state: TransferState, error?: Error) => {
        const errorCategory = getErrorCategory(state, error);
        metrics.drive_download_errors_total.increment({
            type: errorCategory,
            shareType: shareType === MetricShareType.Own ? 'main' : shareType,
            initiator,
        });
    };

    /*
     * For stateful downloads
     */
    const observe = (downloads: Download[]) => {
        for (const download of downloads) {
            // shareType is infered from the download rootShareId (each links are LinkDownload type)
            const shareType = getShareIdType(download.links[0]?.shareId);
            const key = getKey(download.id, download.retries || 0);
            // These 3 states are final (we omit skipped and cancelled)
            if ([TransferState.Done, TransferState.Error, TransferState.NetworkError].includes(download.state)) {
                if (!processed.has(key)) {
                    metrics.drive_download_success_rate_total.increment({
                        status: download.state === TransferState.Done ? 'success' : 'failure',
                        retry: download.retries && download.retries > 0 ? 'true' : 'false',
                        shareType: shareType === MetricShareType.Own ? 'main' : shareType,
                    });

                    // These 2 states are final Error states
                    if ([TransferState.Error, TransferState.NetworkError].includes(download.state)) {
                        if (!processed.has(key)) {
                            logDownloadError(shareType, download.state, download.error);
                        }
                    }

                    setProcessed((prev) => new Set(prev.add(key)));
                }
            }
        }
    };

    /*
     * For non-stateful downloads (Preview)
     */
    const report = (shareId: string, state: TransferState.Done | TransferState.Error, error?: Error) => {
        const shareType = getShareIdType(shareId);

        metrics.drive_download_success_rate_total.increment({
            status: state === TransferState.Done ? 'success' : 'failure',
            retry: 'false',
            shareType: shareType === MetricShareType.Own ? 'main' : shareType,
        });

        if (state === TransferState.Error) {
            logDownloadError(shareType, state, error);
        }
    };

    return {
        observe,
        report,
    };
};
