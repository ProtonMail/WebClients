import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';

export enum PASS_ALIASES_ERROR_STEP {
    /** Failed to init the pass bridge */
    INIT_BRIDGE = 'PassAliasesInitError',
    /** Failed to create an alias */
    CREATE_ALIAS = 'PassAliasesCreateError',
}

export class PassAliasesError extends Error {
    constructor(error: Error, step: PASS_ALIASES_ERROR_STEP) {
        let name = error?.name ? error.name + ':' : '';
        let message = error?.message || '';

        if (error instanceof ApiError) {
            const sentryError = getApiError(error);
            const errorCode = sentryError?.code ? ` ${sentryError.code}` : '';
            name = `API Error${errorCode}` + ' - ' + name;

            if (sentryError?.message && sentryError?.code >= 400 && sentryError?.code < 500) {
                message = getApiErrorMessage(error) || message;
            }
        }

        super(`${name} ${message}`);

        this.name = step;
        this.stack = error.stack;
    }
}

export default PassAliasesError;
