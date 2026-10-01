/**
 * The API's answers to the credentials requests that the credentials machine acts on, as errors it can tell apart.
 * The actors throw them in place of the API error, which they keep as the cause.
 */
import { c } from 'ttag';

import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

/** Shows the API's message; not traced, like the API error it replaces. */
abstract class CredentialsApiError extends Error {
    readonly trace = false;

    constructor(cause: unknown) {
        super(getApiErrorMessage(cause) || c('Error').t`Unknown error`, { cause });
    }
}

/** The account signs in with its SSO provider, not a password. */
export class SwitchToSSOError extends CredentialsApiError {
    name = 'SwitchToSSOError';
}

/** The account has no SSO; it signs in with a password. */
export class SwitchToSRPError extends CredentialsApiError {
    name = 'SwitchToSRPError';
}

/** Wrong username or password. */
export class InvalidLoginError extends CredentialsApiError {
    name = 'InvalidLoginError';
}

/** Rethrows the API error of a credentials request as one of the errors above when it is one, as is otherwise. */
export const rethrowCredentialsError = (error: unknown): never => {
    switch (getApiError(error).code) {
        case API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO:
            throw new SwitchToSSOError(error);
        case API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SRP:
            throw new SwitchToSRPError(error);
        case API_CUSTOM_ERROR_CODES.INVALID_LOGIN:
            throw new InvalidLoginError(error);
    }
    throw error;
};
