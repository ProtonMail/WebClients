import { GenericErrorPayload } from './interface';
import { getApiError, getApiErrorMessage } from '../api/helpers/apiErrorHelper';

export const getGenericErrorPayload = (e: any): GenericErrorPayload => {
    const apiError = getApiError(e);
    return {
        message: getApiErrorMessage(e) || e.message || 'Unknown error',
        ...apiError,
    };
};
