import { getApiError, getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

export type MetricsApiStatusTypes = '4xx' | '5xx' | 'failure';

export default function observeApiError(
    error: any,
    metricObserver: (status: MetricsApiStatusTypes) => void,
    ignoreCodes = [API_CUSTOM_ERROR_CODES.CARD_DECLINED, API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED]
) {
    if (!error) {
        return;
    }

    const { status, code } = getApiError(error);

    if (
        !status ||
        status === -1 ||
        error?.name === 'AbortError' ||
        getIsConnectionIssue(error) ||
        ignoreCodes.includes(code)
    ) {
        return;
    }

    if (status >= 500) {
        return metricObserver('5xx');
    }

    if (status >= 400) {
        return metricObserver('4xx');
    }

    return metricObserver('failure');
}
