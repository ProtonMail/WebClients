import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { deleteVersionCookies } from '../../hooks/useEarlyAccess';

const API_ERROR_KEY = 'API_ERROR_REFRESH';
const EARLY_ACCESS_KEY = 'EARLY_ACCESS_RESET';

export const clearAutomaticErrorRefresh = () => {
    sessionStorage.removeItem(API_ERROR_KEY);
    sessionStorage.removeItem(EARLY_ACCESS_KEY);
};

const handleEarlyAccessRefresh = () => {
    const oldValue = Number(sessionStorage.getItem(EARLY_ACCESS_KEY));
    // If it's the first time, we try a simple reload.
    if (!oldValue) {
        sessionStorage.setItem(EARLY_ACCESS_KEY, '1');
        window.location.reload();
        return true;
    }
    // If this error happens a second time, we force delete everything regarding version cookie and attempt another reload.
    if (oldValue === 1) {
        sessionStorage.setItem(EARLY_ACCESS_KEY, '2');
        deleteVersionCookies();
        window.location.reload();
        return true;
    }
    return false;
};

const handleApiErrorRefresh = () => {
    if (!sessionStorage.getItem(API_ERROR_KEY)) {
        sessionStorage.setItem(API_ERROR_KEY, 'true');
        window.location.reload();
        return true;
    }
    return false;
};

export const handleAutomaticErrorRefresh = (error: any) => {
    const apiError = getApiError(error);
    // If there is no API error message or it's a chunk loading error, assume it's a resource loading error.
    if (!apiError.message || error?.message.contains('Loading chunk')) {
        if (handleEarlyAccessRefresh()) {
            return true;
        }
    } else if (apiError.message) {
        if (handleApiErrorRefresh()) {
            return true;
        }
    }
    return false;
};
