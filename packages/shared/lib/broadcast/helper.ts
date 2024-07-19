import { getApiError, getApiErrorMessage } from '../api/helpers/apiErrorHelper';
import type { GenericErrorPayload } from './interface';

export const getGenericErrorPayload = (e: any): GenericErrorPayload => {
    const apiError = getApiError(e);
    return {
        message: getApiErrorMessage(e) || e.message || 'Unknown error',
        ...apiError,
    };
};
