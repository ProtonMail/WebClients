/**
 * How the forgot-password requests fail in the ways the forgot-password machine acts on, as errors it can tell apart.
 * The requests throw them in place of what failed, which they keep as the cause. Each request maps its own API codes:
 * the same code is a wrong code from one request, and a refused reset token from another.
 */
import { c } from 'ttag';

import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

/** Shows the API's message; not traced, like the API error it replaces. */
abstract class ForgotPasswordApiError extends Error {
    readonly trace = false;

    constructor(cause: unknown) {
        super(getApiErrorMessage(cause) || c('Error').t`Unknown error`, { cause });
    }
}

/** The API won't send a code to the recovery method, and says why (a rate limit, say). */
export class ResetMethodNotAllowedError extends ForgotPasswordApiError {
    name = 'ResetMethodNotAllowedError';
}

/** The code sent to the recovery email or phone is wrong. */
export class InvalidResetCodeError extends ForgotPasswordApiError {
    name = 'InvalidResetCodeError';
}

/**
 * The reset refused the token (it expired, say): the password is unchanged, and only a new attempt, with a new code or
 * link, can reset it. Says that rather than the API's reason.
 */
export class ResetTokenRejectedError extends Error {
    name = 'ResetTokenRejectedError';

    /** Not traced: a token running out isn't something that went wrong. */
    readonly trace = false;

    constructor(cause: unknown) {
        super(c('Error').t`This code or link is no longer valid. Please try again.`, { cause });
    }
}

/**
 * The reset took the token, then refused the new keys (an address added meanwhile, say): the password is unchanged,
 * but the token is used up, so only a new attempt can reset it. Says that rather than the API's reason, and is traced,
 * since the keys the reset sends shouldn't be refused.
 */
export class ResetKeysRejectedError extends Error {
    name = 'ResetKeysRejectedError';

    constructor(cause: unknown) {
        super(c('Error').t`Your password couldn't be reset. Please try again.`, { cause });
    }
}

/**
 * The recovery phrase signed in, but decrypts none of the account's keys. It shouldn't happen, since a phrase can only
 * sign in while every active key has a copy encrypted with it, so its message isn't translated. Signing in deleted any
 * reset code, so the attempt can't go on: the user starts over, and it's shown and traced like any unexpected failure.
 */
export class NoKeysDecryptedUsingPhraseError extends Error {
    name = 'NoKeysDecryptedUsingPhraseError';

    constructor() {
        super('The recovery phrase signed in, but decrypted none of the keys');
    }
}

/**
 * The password is changed, but signing in with it failed: the form can't be sent again, so the user is sent to sign in
 * with the new password. Keeps what failed as the cause, which the page still traces.
 */
export class SignInAfterResetError extends Error {
    name = 'SignInAfterResetError';

    constructor(cause: unknown) {
        super('Signing in after the password reset failed', { cause });
    }
}

/** Rethrows a request's API error with this code as `ErrorClass`, and any other error as it is. */
const rethrowCode =
    (code: number, ErrorClass: new (cause: unknown) => ForgotPasswordApiError) =>
    (error: unknown): never => {
        if (getApiError(error).code === code) {
            throw new ErrorClass(error);
        }
        throw error;
    };

/** Sending a reset code: the API refuses the method. */
export const rethrowSendResetCodeError = rethrowCode(API_CUSTOM_ERROR_CODES.NOT_ALLOWED, ResetMethodNotAllowedError);

/** Checking a reset code: the code is wrong. */
export const rethrowValidateResetCodeError = rethrowCode(API_CUSTOM_ERROR_CODES.INVALID_VALUE, InvalidResetCodeError);

/**
 * Resetting the keys with the reset token. Before the API takes the token, it only refuses it (a 422 with this code)
 * or bans the request (a 429); it takes the token before checking anything else, so any other refusal leaves it used
 * up, whatever the reason (Slim-API's `UserKeyService::resetKeys`). A server error or a failed request says nothing
 * about the token: a retry either works or is refused like a used-up token.
 */
export const rethrowResetKeysError = (error: unknown): never => {
    const { code, status } = getApiError(error);
    if (status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY && code === API_CUSTOM_ERROR_CODES.INVALID_VALUE) {
        throw new ResetTokenRejectedError(error);
    }
    if (status >= 400 && status < 500 && status !== HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
        throw new ResetKeysRejectedError(error);
    }
    throw error;
};

/** Once the password is changed, anything failing is signing in with it. */
export const rethrowSignInAfterResetError = (error: unknown): never => {
    throw new SignInAfterResetError(error);
};
