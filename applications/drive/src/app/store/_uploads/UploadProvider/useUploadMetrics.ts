import { useRef } from 'react';

import metrics from '@proton/metrics';
import {
    getApiError,
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { is4xx, is5xx } from '../../../utils/errorHandling/apiErrors';
import { MetricShareType } from '../../../utils/type/MetricShareType';
import type { Share } from '../../_shares/interface';
import { ShareType } from '../../_shares/interface';
import useShareState from '../../_shares/useSharesState';
import { isVerificationError } from '../worker/verifier';
import type { FileUploadReady } from './interface';

export enum UploadErrorCategory {
    FreeSpaceExceeded = 'free_space_exceeded',
    TooManyChildren = 'too_many_children',
    NetworkError = 'network_error',
    ServerError = 'server_error',
    IntegrityError = 'integrity_error',
    Unknown = 'unknown',
    RateLimited = 'rate_limited',
    HTTPClientError = '4xx',
    HTTPServerError = '5xx',
}

export interface FailedUploadMetadata {
    shareId: string;
    numberOfErrors: number;
    encryptedTotalTransferSize: number;
    roundedUnencryptedFileSize: number;
}

const IGNORED_ERROR_CATEGORIES_FROM_SUCCESS_RATE = [
    UploadErrorCategory.FreeSpaceExceeded,
    UploadErrorCategory.TooManyChildren,
    UploadErrorCategory.NetworkError,
];

const REPORT_ERROR_USERS_EVERY = 5 * 60 * 1000; // 5 minutes,

const ROUND_BYTES = 10000; // For privacy we round file.size metrics to 10k bytes

export const getFailedUploadMetadata = (
    nextFileUpload: FileUploadReady,
    progresses: {
        [x: string]: number;
    }
): FailedUploadMetadata => ({
    shareId: nextFileUpload.shareId,
    numberOfErrors: nextFileUpload.numberOfErrors,
    encryptedTotalTransferSize: Object.values(progresses).reduce((sum, value) => sum + value, 0),
    roundedUnencryptedFileSize: Math.max(Math.round(nextFileUpload.file.size / ROUND_BYTES) * ROUND_BYTES, ROUND_BYTES),
});

export default function useUploadMetrics(isPaid: boolean, metricsModule = metrics) {
    const lastErroringUserReport = useRef(0);

    // Hack: ideally we should use useShare. But that adds complexity with
    // promises and need to handle exceptions etc. that are not essential
    // for metrics, and when file is uploading, we know the share must be
    // already in cache. (to be continued...)
    const { getShare } = useShareState();

    const getShareIdType = (shareId: string): MetricShareType => {
        const share = getShare(shareId);
        return getShareType(share);
    };

    const uploadSucceeded = (shareId: string, numberOfErrors = 0) => {
        const shareType = getShareIdType(shareId);
        const retry = numberOfErrors > 0;

        metricsModule.drive_upload_success_rate_total.increment({
            status: 'success',
            shareType,
            retry: retry ? 'true' : 'false',
            initiator: 'explicit',
        });
    };

    const uploadFailed = (failedUploadMetadata: FailedUploadMetadata, error: any) => {
        const shareType = getShareIdType(failedUploadMetadata.shareId);
        const errorCategory = getErrorCategory(error);
        const retry = failedUploadMetadata.numberOfErrors > 1;

        if (!IGNORED_ERROR_CATEGORIES_FROM_SUCCESS_RATE.includes(errorCategory)) {
            metricsModule.drive_upload_success_rate_total.increment({
                status: 'failure',
                shareType,
                retry: retry ? 'true' : 'false',
                initiator: 'explicit',
            });
        }
        // Type of error
        metricsModule.drive_upload_errors_total.increment({
            type: errorCategory,
            shareType: shareType === MetricShareType.Own ? 'main' : shareType,
            initiator: 'explicit',
        });

        // How many encrypted bytes were sent before it failed
        metricsModule.drive_upload_errors_transfer_size_histogram.observe({
            Value: failedUploadMetadata.encryptedTotalTransferSize,
            Labels: {},
        });

        // Rounded unencrypted file size of the file that failed the upload
        metricsModule.drive_upload_errors_file_size_histogram.observe({
            Value: failedUploadMetadata.roundedUnencryptedFileSize,
            Labels: {},
        });

        if (Date.now() - lastErroringUserReport.current > REPORT_ERROR_USERS_EVERY) {
            metricsModule.drive_upload_erroring_users_total.increment({
                plan: isPaid ? 'paid' : 'free',
                shareType,
                initiator: 'explicit',
            });

            lastErroringUserReport.current = Date.now();
        }
    };

    return {
        uploadSucceeded,
        uploadFailed,
    };
}

export function getShareType(share?: Share): MetricShareType {
    // (see above...) But if the share is not there anyway, we need to
    // still decide about share type. Own shares are always loaded by
    // default, so we can bet that its not own/device/photo and thus
    // we can set its shared one.
    if (!share) {
        return MetricShareType.Shared;
    }

    if (share.type === ShareType.default) {
        return MetricShareType.Own;
    } else if (share.type === ShareType.photos) {
        return MetricShareType.Photo;
    } else if (share.type === ShareType.device) {
        return MetricShareType.Device;
    }
    return MetricShareType.Shared;
}

export function getErrorCategory(error: any): UploadErrorCategory {
    const apiError = getApiError(error);
    const statusCode = apiError?.code || error?.statusCode;

    if (statusCode === API_CUSTOM_ERROR_CODES.TOO_MANY_CHILDREN) {
        return UploadErrorCategory.TooManyChildren;
    } else if (statusCode === API_CUSTOM_ERROR_CODES.FREE_SPACE_EXCEEDED) {
        return UploadErrorCategory.FreeSpaceExceeded;
    } else if (getIsUnreachableError(error) || getIsTimeoutError(error)) {
        return UploadErrorCategory.ServerError;
    } else if (getIsOfflineError(error) || getIsNetworkError(error)) {
        return UploadErrorCategory.NetworkError;
    } else if (isVerificationError(error)) {
        return UploadErrorCategory.IntegrityError;
    } else if (error?.statusCode && error?.statusCode === 429) {
        return UploadErrorCategory.RateLimited;
    } else if (error?.statusCode && is4xx(error?.statusCode)) {
        return UploadErrorCategory.HTTPClientError;
    } else if (error?.statusCode && is5xx(error?.statusCode)) {
        return UploadErrorCategory.HTTPServerError;
    }
    return UploadErrorCategory.Unknown;
}
