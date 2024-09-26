import { useRef, useState } from 'react';

import metrics from '@proton/metrics';
import type { HttpsProtonMeDriveDownloadErrorsTotalV2SchemaJson } from '@proton/metrics/types/drive_download_errors_total_v2.schema';
import {
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { TransferState } from '../../../components/TransferManager/transfer';
import { is4xx, is5xx, isCryptoEnrichedError } from '../../../utils/errorHandling/apiErrors';
import type { DownloadErrorCategoryType, MetricShareType } from '../../../utils/type/MetricTypes';
import { DownloadErrorCategory } from '../../../utils/type/MetricTypes';
import useSharesState from '../../_shares/useSharesState';
import { getShareType } from '../../_uploads/UploadProvider/useUploadMetrics';
import type { Download } from './interface';

const REPORT_ERROR_USERS_EVERY = 5 * 60 * 1000; // 5 minutes

export function getErrorCategory(state: TransferState, error: any): DownloadErrorCategoryType {
    if (getIsUnreachableError(error) || getIsTimeoutError(error)) {
        return DownloadErrorCategory.ServerError;
    } else if (getIsOfflineError(error) || getIsNetworkError(error) || state === TransferState.NetworkError) {
        return DownloadErrorCategory.NetworkError;
    } else if (error?.statusCode && error?.statusCode === 429) {
        return DownloadErrorCategory.RateLimited;
    } else if (isCryptoEnrichedError(error)) {
        return DownloadErrorCategory.DecryptionError;
    } else if (error?.statusCode && is4xx(error?.statusCode)) {
        return DownloadErrorCategory.HTTPClientError;
    } else if (error?.statusCode && is5xx(error?.statusCode)) {
        return DownloadErrorCategory.HTTPServerError;
    }
    return DownloadErrorCategory.Unknown;
}

const getKey = (downloadId: string, retries: number) => `${downloadId}-${retries}`;

export const useDownloadMetrics = (
    initiator: HttpsProtonMeDriveDownloadErrorsTotalV2SchemaJson['Labels']['initiator'],
    user?: UserModel
) => {
    const { getShare } = useSharesState();
    const [processed, setProcessed] = useState<Set<string>>(new Set());
    const lastErroringUserReport = useRef(0);

    const getShareIdType = (shareId: string): MetricShareType => {
        const share = getShare(shareId);
        return getShareType(share);
    };

    const logDownloadError = (shareType: MetricShareType, state: TransferState, error?: Error) => {
        const errorCategory = getErrorCategory(state, error);
        metrics.drive_download_errors_total.increment({
            type: errorCategory,
            shareType,
            initiator,
        });
    };

    const logSuccessRate = (shareType: MetricShareType, state: TransferState, retry: boolean) => {
        metrics.drive_download_success_rate_total.increment({
            status: state === TransferState.Done ? 'success' : 'failure',
            retry: retry ? 'true' : 'false',
            shareType,
        });
    };

    const maybeLogUserError = (shareType: MetricShareType, isError: boolean) => {
        if (isError && Date.now() - lastErroringUserReport.current > REPORT_ERROR_USERS_EVERY) {
            metrics.drive_download_erroring_users_total.increment({
                plan: user ? (user.isPaid ? 'paid' : 'free') : 'unknown',
                shareType,
            });
            lastErroringUserReport.current = Date.now();
        }
    };

    const logDownloadMetrics = (shareType: MetricShareType, state: TransferState, retry: boolean, error?: Error) => {
        logSuccessRate(shareType, state, retry);
        // These 2 states are final Error states
        const isError = [TransferState.Error, TransferState.NetworkError].includes(state);
        if (isError) {
            logDownloadError(shareType, state, error);
        }
        maybeLogUserError(shareType, isError);
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
                    logDownloadMetrics(shareType, download.state, Boolean(download.retries), download.error);
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
        logDownloadMetrics(shareType, state, false, error);
    };

    return {
        observe,
        report,
    };
};
