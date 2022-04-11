import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { wait } from '@proton/shared/lib/helpers/promise';
import { noop } from '@proton/shared/lib/helpers/function';
import { deleteVersionCookies } from '../../hooks/useEarlyAccess';
import { setCurrentRetries } from '../../helpers/earlyAccessDesynchronization';

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
        setCurrentRetries(2);
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

const handleError = (error: any) => {
    const apiError = getApiError(error);
    // If there is no API error message or it's a chunk loading error, assume it's a resource loading error.
    if (!apiError.message || error?.message.contains('chunk')) {
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

export const wrapUnloadError = <T>(promise: Promise<T>) => {
    // In Firefox, navigation events cancel ongoing network requests. This triggers the error handler and error
    // screen to be displayed. We set up a 'beforeunload' listener to detect unload to not unnecessarily
    // show cancelled network requests errors as fatal errors, and keep showing the loader screen instead.
    let unloaded = false;

    const handleUnload = () => {
        unloaded = true;
    };

    const listen = () => {
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    };

    const unlisten = listen();

    return promise
        .then((result) => {
            clearAutomaticErrorRefresh();
            unlisten();
            return result;
        })
        .catch(async (e) => {
            // Wait an arbitrary amount of time to ensure the unload listener is first.
            await wait(3000);
            unlisten();
            // Never resolve the promise if the browser has unloaded or if we're refreshing
            if (unloaded || handleError(e)) {
                return new Promise(noop);
            }
            throw e;
        });
};
