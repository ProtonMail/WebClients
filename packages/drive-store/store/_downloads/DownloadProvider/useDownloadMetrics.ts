import { useRef } from 'react';

import metrics from '@proton/metrics/metricsInstance';
import type { HttpsProtonMeDriveDownloadErrorsTotalV2SchemaJson } from '@proton/metrics/types/drive_download_errors_total_v2.schema';
import {
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { TransferState } from '../../../components/TransferManager/transfer';
import { isAbortError, isIgnoredErrorForReporting, sendErrorReport } from '../../../utils/errorHandling';
import { is4xx, is5xx, isCryptoEnrichedError } from '../../../utils/errorHandling/apiErrors';
import { getIsPublicContext } from '../../../utils/getIsPublicContext';
import { UserAvailabilityTypes } from '../../../utils/metrics/types/userSuccessMetricsTypes';
import { userSuccessMetrics } from '../../../utils/metrics/userSuccessMetrics';
import type { DownloadErrorCategoryType, MetricShareTypeWithPublic } from '../../../utils/type/MetricTypes';
import { DownloadErrorCategory, MetricSharePublicType } from '../../../utils/type/MetricTypes';
import { useSharesStore } from '../../../zustand/share/shares.store';
import { getShareType } from '../../_uploads/UploadProvider/useUploadMetrics';
import { getMetricsUserPlan } from '../../_user/getMetricsUserPlan';
import fileSaver from '../fileSaver/fileSaver';
import type { Download } from './interface';

const REPORT_ERROR_USERS_EVERY = 5 * 60 * 1000; // 5 minutes

function getErrorCategory(state: TransferState, error: any): DownloadErrorCategoryType {
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

    sendErrorReport(error, {
        tags: {
            label: 'download-unknown-error',
        },
    });

    return DownloadErrorCategory.Unknown;
}

export const useDownloadMetrics = (
    initiator: HttpsProtonMeDriveDownloadErrorsTotalV2SchemaJson['Labels']['initiator'],
    user?: UserModel
) => {
    const getShare = useSharesStore((state) => state.getShare);
    const lastErroringUserReport = useRef(0);

    const getShareIdType = (shareId: string): MetricShareTypeWithPublic => {
        const share = getShare(shareId);
        return getIsPublicContext() ? MetricSharePublicType.SharedPublic : getShareType(share);
    };

    const logDownloadError = (shareType: MetricShareTypeWithPublic, state: TransferState, error?: Error) => {
        const errorCategory = getErrorCategory(state, error);
        metrics.drive_download_errors_total.increment({
            type: errorCategory,
            shareType,
            initiator,
        });
    };

    const logSuccessRate = (
        shareType: MetricShareTypeWithPublic,
        state: TransferState,
        retry: boolean,
        size?: number
    ) => {
        // Drive generic metric
        metrics.drive_download_success_rate_total.increment({
            status: state === TransferState.Done ? 'success' : 'failure',
            retry: retry ? 'true' : 'false',
            shareType,
        });

        // Web only metric
        void fileSaver.instance.selectMechanismForDownload(size).then((mechanism) => {
            metrics.drive_download_mechanism_success_rate_total.increment({
                status: state === TransferState.Done ? 'success' : 'failure',
                retry: retry ? 'true' : 'false',
                mechanism,
            });
        });
    };

    const maybeLogUserError = (shareType: MetricShareTypeWithPublic, isError: boolean, error?: Error) => {
        if (isError && !isIgnoredErrorForReporting(error)) {
            if (Date.now() - lastErroringUserReport.current > REPORT_ERROR_USERS_EVERY) {
                metrics.drive_download_erroring_users_total.increment({
                    plan: getMetricsUserPlan({ user, isPublicContext: getIsPublicContext() }),
                    shareType,
                });
                lastErroringUserReport.current = Date.now();
            }
            userSuccessMetrics.mark(UserAvailabilityTypes.coreFeatureError);
        }
    };

    const logDownloadMetrics = (
        shareType: MetricShareTypeWithPublic,
        { state, retries, error, meta }: Pick<Download, 'state' | 'retries' | 'error' | 'meta'>
    ) => {
        logSuccessRate(shareType, state, Boolean(retries), meta.size);
        // These 2 states are final Error states
        const isError = [TransferState.Error, TransferState.NetworkError].includes(state);
        if (isError) {
            logDownloadError(shareType, state, error);
        }
        maybeLogUserError(shareType, isError, error);
    };

    /*
     * For non-stateful downloads (Preview)
     */
    const report = (shareId: string, state: TransferState.Done | TransferState.Error, size: number, error?: Error) => {
        if (isAbortError(error)) {
            return;
        }

        const shareType = getShareIdType(shareId);
        logDownloadMetrics(shareType, {
            state,
            retries: 0,
            meta: {
                filename: '',
                mimeType: '',
                size,
            },
            error,
        });
    };

    return {
        report,
    };
};
