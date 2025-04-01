import { isAbortError } from '@proton/pass/lib/api/errors';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';

export const withAbortPayload = (error: unknown) => ({
    payload: {
        aborted: isAbortError(error),
        error: getErrorMessage(error),
    },
});
