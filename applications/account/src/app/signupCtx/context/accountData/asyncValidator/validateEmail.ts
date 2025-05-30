import { c } from 'ttag';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckEmailAvailability, queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getOwnershipVerificationHeaders, mergeHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';

import { type AsyncValidationState, AsyncValidationStateValue } from './createAsyncValidator';

export const validateUsernameAvailability = async (
    username: string,
    api: Api,
    abortController: AbortController
): Promise<AsyncValidationState> => {
    try {
        await api({
            ...mergeHeaders(queryCheckUsernameAvailability(username, true), getOwnershipVerificationHeaders('lax')),
            signal: abortController.signal,
        });

        return { state: AsyncValidationStateValue.Success, message: '', value: username, error: undefined };
    } catch (error) {
        const { code, message } = getApiError(error);
        if (
            [
                API_CUSTOM_ERROR_CODES.ALREADY_USED,
                API_CUSTOM_ERROR_CODES.USERNAME_ALREADY_USED,
                API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
            ].includes(code)
        ) {
            return { state: AsyncValidationStateValue.Fatal, message, value: username, error };
        }
        return {
            state: AsyncValidationStateValue.Error,
            message: message || c('Error').t`Try again later`,
            value: username,
            error,
        };
    }
};

export const validateEmailAvailability = async (
    email: string,
    api: Api,
    abortController: AbortController
): Promise<AsyncValidationState> => {
    try {
        await api({
            ...mergeHeaders(queryCheckEmailAvailability(email), getOwnershipVerificationHeaders('lax')),
            signal: abortController.signal,
        });

        return { state: AsyncValidationStateValue.Success, message: '', value: email, error: undefined };
    } catch (error) {
        const { code, message } = getApiError(error);
        if (
            [
                API_CUSTOM_ERROR_CODES.ALREADY_USED,
                API_CUSTOM_ERROR_CODES.EMAIL_FORMAT,
                API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
            ].includes(code)
        ) {
            return { state: AsyncValidationStateValue.Fatal, message, value: email, error };
        }
        return {
            state: AsyncValidationStateValue.Error,
            message: message || c('Error').t`Try again later`,
            value: email,
            error,
        };
    }
};
