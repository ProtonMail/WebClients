/**
 * The API's answers to the credentials requests that the credentials machine acts on, as errors it can tell apart.
 * The actors throw them in place of the API error, which they keep as the cause.
 */
import { c } from 'ttag';

import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CODES, HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
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

/** Wrong username or password, or an account the password sign-in can't accept. */
export class InvalidLoginError extends CredentialsApiError {
    name = 'InvalidLoginError';
}

/** A username the password sign-in can't accept, which `/auth/info` let through: it's the username to fix. */
export class InvalidUsernameError extends CredentialsApiError {
    name = 'InvalidUsernameError';
}

/**
 * The API refused the SSO sign-in after the identity provider: e.g. the organization's SSO is misconfigured, or the
 * user doesn't belong to it. Its message is meant for the user.
 */
export class SSOSignInRejectedError extends CredentialsApiError {
    name = 'SSOSignInRejectedError';
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

/**
 * Like `rethrowCredentialsError`, for the password sign-in (`POST /auth`), which also refuses with a 422 the user should
 * read on the form: `INVALID_VALUE` for a username it can't accept ("Invalid username", or "Invalid email address" for
 * an `@` one), and `NOT_ALLOWED` for an account that can't sign in here ("Account setup incomplete…", "Use of this
 * client requires permissions…"). Its other answers with these codes are 400s.
 */
export const rethrowPasswordLoginError = (error: unknown): never => {
    const { status, code } = getApiError(error);
    if (status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
        if (code === API_CUSTOM_ERROR_CODES.INVALID_VALUE) {
            throw new InvalidUsernameError(error);
        }
        if (code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED) {
            throw new InvalidLoginError(error);
        }
    }
    return rethrowCredentialsError(error);
};

/** Rethrows the API's refusal of the SSO token exchange (422, `NOT_ALLOWED`) as `SSOSignInRejectedError`. */
export const rethrowSSOTokenError = (error: unknown): never => {
    const { status, code } = getApiError(error);
    if (status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY && code === API_CODES.NOT_ALLOWED_ERROR) {
        throw new SSOSignInRejectedError(error);
    }
    throw error;
};
