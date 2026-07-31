import {
    getApiError,
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { sendErrorReport } from '../../../utils/errorHandling';
import { is4xx, is5xx } from '../../../utils/errorHandling/apiErrors';
import type { UploadErrorCategoryType } from '../../../utils/type/MetricTypes';
import { MetricShareType, UploadErrorCategory } from '../../../utils/type/MetricTypes';
import type { Share } from '../../_shares/interface';
import { ShareType } from '../../_shares/interface';
import { isVerificationError } from '../worker/verifier';

export function getShareType(share?: Share): MetricShareType {
    // (see above...) But if the share is not there anyway, we need to
    // still decide about share type. Own shares are always loaded by
    // default, so we can bet that its not own/device/photo and thus
    // we can set its shared one.
    if (!share) {
        return MetricShareType.Shared;
    }

    if (share.type === ShareType.default) {
        return MetricShareType.Main;
    } else if (share.type === ShareType.photos) {
        return MetricShareType.Photo;
    } else if (share.type === ShareType.device) {
        return MetricShareType.Device;
    }
    return share.linkType === LinkType.ALBUM ? MetricShareType.SharedPhoto : MetricShareType.Shared;
}

export function getErrorCategory(error: any): UploadErrorCategoryType {
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

    sendErrorReport(error, {
        tags: {
            label: 'upload-unknown-error',
        },
    });
    return UploadErrorCategory.Unknown;
}
