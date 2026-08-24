import { isAbortError } from '../../../lib/api/errors';
import { getErrorMessage } from '../../../utils/errors/get-error-message';

export const withAbortPayload = (error: unknown) => ({
    payload: {
        aborted: isAbortError(error),
        error: getErrorMessage(error),
    },
});
