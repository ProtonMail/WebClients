import { useRef } from 'react';

import metrics from '@proton/metrics';
import { getApiError, getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { Share, ShareType } from '../../_shares/interface';
import useShareState from '../../_shares/useSharesState';
import { isVerificationError } from '../worker/verifier';

export enum UploadShareType {
    Own = 'own',
    Device = 'device',
    Photo = 'photo',
    Shared = 'shared',
}

export enum UploadErrorCategory {
    FreeSpaceExceeded = 'free_space_exceeded',
    TooManyChildren = 'too_many_children',
    NetworkError = 'network_error',
    IntegrityError = 'integrity_error',
    Unknown = 'unknown',
}

const REPORT_ERROR_USERS_EVERY = 10 * 60 * 1000; // 10 minutes,

export default function useUploadMetrics(isPaid: boolean, metricsModule = metrics) {
    const lastErroringUserReport = useRef(0);

    // Hack: ideally we should use useShare. But that adds complexity with
    // promises and need to handle exceptions etc. that are not essential
    // for metrics, and when file is uploading, we know the share must be
    // already in cache. (to be continued...)
    const { getShare } = useShareState();

    const getShareIdType = (shareId: string): UploadShareType => {
        const share = getShare(shareId);
        return getShareType(share);
    };

    const uploadSucceeded = (shareId: string, numberOfErrors = 0) => {
        const shareType = getShareIdType(shareId);
        const retry = numberOfErrors > 1;

        metricsModule.drive_upload_success_rate_total.increment({
            status: 'success',
            shareType,
            retry: retry ? 'true' : 'false',
            initiator: 'explicit',
        });
    };

    const uploadFailed = (shareId: string, error: any, numberOfErrors = 0) => {
        const shareType = getShareIdType(shareId);
        const errorCategory = getErrorCategory(error);
        const retry = numberOfErrors > 1;

        metricsModule.drive_upload_success_rate_total.increment({
            status: 'failure',
            shareType,
            retry: retry ? 'true' : 'false',
            initiator: 'explicit',
        });
        metricsModule.drive_upload_errors_total.increment({
            type: errorCategory,
            shareType,
            initiator: 'explicit',
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

export function getShareType(share?: Share): UploadShareType {
    // (see above...) But if the share is not there anyway, we need to
    // still decide about share type. Own shares are always loaded by
    // default, so we can bet that its not own/device/photo and thus
    // we can set its shared one.
    if (!share) {
        return UploadShareType.Shared;
    }

    if (share.type === ShareType.default) {
        return UploadShareType.Own;
    } else if (share.type === ShareType.photos) {
        return UploadShareType.Photo;
    } else if (share.type === ShareType.device) {
        return UploadShareType.Device;
    }
    return UploadShareType.Shared;
}

export function getErrorCategory(error: any): UploadErrorCategory {
    const apiError = getApiError(error);
    const statusCode = apiError?.code || error?.statusCode;

    if (statusCode === API_CUSTOM_ERROR_CODES.TOO_MANY_CHILDREN) {
        return UploadErrorCategory.TooManyChildren;
    } else if (statusCode === API_CUSTOM_ERROR_CODES.FREE_SPACE_EXCEEDED) {
        return UploadErrorCategory.FreeSpaceExceeded;
    } else if (getIsConnectionIssue(error)) {
        return UploadErrorCategory.NetworkError;
    } else if (isVerificationError(error)) {
        return UploadErrorCategory.IntegrityError;
    }
    return UploadErrorCategory.Unknown;
}
