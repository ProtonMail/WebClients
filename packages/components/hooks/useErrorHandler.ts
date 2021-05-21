import { useCallback } from 'react';
import { c } from 'ttag';
import { getApiErrorMessage, getIsUnreachableError } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { traceError } from 'proton-shared/lib/helpers/sentry';

import useNotifications from './useNotifications';

const ignoreErrors = ['InactiveSession', 'AppVersionBadError', 'OfflineError'];

const useErrorHandler = () => {
    const { createNotification } = useNotifications();

    return useCallback((error: any, { notify = true, trace = true }: { notify?: boolean; trace?: boolean } = {}) => {
        const apiErrorMessage = getApiErrorMessage(error);
        const errorMessage = error.message || c('Error').t`Unknown error`;

        // Bad app version and unreachable errors are handled in a top banner
        const shouldNotify = notify && !ignoreErrors.includes(error.name) && !getIsUnreachableError(error);
        if (shouldNotify) {
            createNotification({ type: 'error', text: apiErrorMessage || errorMessage });
        }

        const shouldTrace = trace && !apiErrorMessage;
        if (shouldTrace) {
            traceError(error);
        }
    }, []);
};

export default useErrorHandler;
