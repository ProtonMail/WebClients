import { c } from 'ttag';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckEmailAvailability, queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getOwnershipVerificationHeaders, mergeHeaders } from '@proton/shared/lib/fetch/headers';
import { Api } from '@proton/shared/lib/interfaces';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export enum AsyncValidationStateValue {
    Idle,
    Loading,
    Success,
    Error,
    Fatal,
}

export interface AsyncValidationState {
    state: AsyncValidationStateValue;
    value: string;
    message: string;
}

type AsyncValidator = (value: string, abortController: AbortController) => Promise<AsyncValidationState>;

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

        return { state: AsyncValidationStateValue.Success, message: '', value: username };
    } catch (e) {
        const { code, message } = getApiError(e);
        if (
            [
                API_CUSTOM_ERROR_CODES.ALREADY_USED,
                API_CUSTOM_ERROR_CODES.USERNAME_ALREADY_USED,
                API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
            ].includes(code)
        ) {
            return { state: AsyncValidationStateValue.Fatal, message, value: username };
        }
        return {
            state: AsyncValidationStateValue.Error,
            message: message || c('Error').t`Try again later`,
            value: username,
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

        return { state: AsyncValidationStateValue.Success, message: '', value: email };
    } catch (e) {
        const { code, message } = getApiError(e);
        if (
            [
                API_CUSTOM_ERROR_CODES.ALREADY_USED,
                API_CUSTOM_ERROR_CODES.EMAIL_FORMAT,
                API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
            ].includes(code)
        ) {
            return { state: AsyncValidationStateValue.Fatal, message, value: email };
        }
        return {
            state: AsyncValidationStateValue.Error,
            message: message || c('Error').t`Try again later`,
            value: email,
        };
    }
};

export const createAsyncValidator = () => {
    let lastValue = '';
    let abortController: AbortController;
    type Setter = (data: AsyncValidationState) => void;

    const cache: { [key: string]: AsyncValidationState } = {};

    const validator = debounce(({ validate, value, set }: { validate: AsyncValidator; value: string; set: Setter }) => {
        abortController?.abort();

        if (lastValue !== value) {
            return;
        }

        const cachedValue = cache[value];
        if (cachedValue) {
            set(cachedValue);
            return;
        }

        abortController = new AbortController();

        validate(value, abortController)
            .then((result) => {
                if (
                    result.state === AsyncValidationStateValue.Success ||
                    result.state === AsyncValidationStateValue.Fatal
                ) {
                    cache[value] = result;
                }

                if (lastValue === value) {
                    set(result);
                }
            })
            .catch(noop);
    }, 300);
    return {
        trigger: ({
            value,
            validate,
            error,
            set,
        }: {
            error: boolean;
            value: string;
            validate: AsyncValidator;
            set: Setter;
        }) => {
            lastValue = value;

            if (error) {
                set({ state: AsyncValidationStateValue.Idle, value, message: '' });
                abortController?.abort();
                validator.cancel();
                return;
            }

            set({ state: AsyncValidationStateValue.Loading, value, message: '' });
            validator({ validate, value, set });
        },
    };
};

export const defaultAsyncValidationState: AsyncValidationState = {
    state: AsyncValidationStateValue.Idle,
    value: '',
    message: '',
};
