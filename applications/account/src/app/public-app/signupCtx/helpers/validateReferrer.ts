import metrics from '@proton/metrics/metricsInstance';
import { observeError } from '@proton/metrics/observeApiError';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces/Api';

export class InvalidReferrerError extends Error {
    name = 'InvalidReferrerError';
}

/** Rejects with `InvalidReferrerError` when the backend does not know the referrer. */
export const validateReferrer = async (api: Api, referralIdentifier: string) => {
    try {
        await api(checkReferrer(referralIdentifier));
        metrics.core_referral_identifier_initialization_total.increment({ status: 'success' });
    } catch (error) {
        const { status, code } = getApiError(error);
        if (
            status === HTTP_STATUS_CODE.NOT_FOUND ||
            (status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY && code === API_CUSTOM_ERROR_CODES.NOT_FOUND)
        ) {
            metrics.core_referral_identifier_initialization_total.increment({ status: 'referral-code-no-found' });
            throw new InvalidReferrerError('Referral code not found');
        }
        observeError(error, (status) => metrics.core_referral_identifier_initialization_total.increment({ status }));
        throw error;
    }
};
