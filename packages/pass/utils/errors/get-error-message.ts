import { c } from 'ttag';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export const getErrorMessage = (error: any, fallback?: string): string => {
    const { code } = getApiError(error);
    if (code === PassErrorCode.SERVICE_NETWORK_ERROR) return c('Error').t`Network error`;
    return getApiErrorMessage(error) || error?.message || (fallback ?? c('Error').t`Unknown error`);
};
