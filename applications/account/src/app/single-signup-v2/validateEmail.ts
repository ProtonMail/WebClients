import { c } from 'ttag';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { queryCheckEmailAvailability, queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getOwnershipVerificationHeaders, mergeHeaders } from '@proton/shared/lib/fetch/headers';
import { Api } from '@proton/shared/lib/interfaces';
import debounce from '@proton/utils/debounce';

import { BaseMeasure } from './interface';
import { AvailableExternalEvents } from './measure';

export enum AsyncValidationStateValue {
    Idle,
    Loading,
    Success,
    Error,
    Fatal,
}

export const validateUsernameAvailability = async (username: string, api: Api, abortController: AbortController) => {
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
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw { state: AsyncValidationStateValue.Fatal, message, value: username };
        }
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw {
            state: AsyncValidationStateValue.Error,
            message: message || c('Error').t`Try again later`,
            value: username,
        };
    }
};

export const validateEmailAvailability = async (email: string, api: Api, abortController: AbortController) => {
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
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw { state: AsyncValidationStateValue.Fatal, message, value: email };
        }
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw {
            state: AsyncValidationStateValue.Error,
            message: message || c('Error').t`Try again later`,
            value: email,
        };
    }
};

export interface AsyncValidationState {
    state: AsyncValidationStateValue;
    value: string;
    message: string;
}

export const createAsyncValidator = (validate: typeof validateEmailAvailability) => {
    let lastValue = '';
    let abortController: AbortController;
    type Setter = (data: AsyncValidationState) => void;

    const cache: { [key: string]: AsyncValidationState } = {};

    const validator = debounce(
        ({
            value,
            api,
            set,
            measure,
        }: {
            value: string;
            api: Api;
            set: Setter;
            measure: BaseMeasure<AvailableExternalEvents>;
        }) => {
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

            validate(value, api, abortController)
                .then((result) => {
                    cache[value] = result;
                    if (lastValue === value) {
                        set(result);

                        measure({
                            event: TelemetryAccountSignupEvents.beAvailableExternal,
                            dimensions: { available: 'yes' },
                        });
                    }
                })
                .catch((result: { state: AsyncValidationStateValue; value: string; message: string }) => {
                    if (result?.state === undefined) {
                        return;
                    }
                    // Only cache actual fatal errors
                    if (result.state === AsyncValidationStateValue.Fatal) {
                        cache[value] = result;

                        measure({
                            event: TelemetryAccountSignupEvents.beAvailableExternal,
                            dimensions: { available: 'no' },
                        });
                    }
                    if (lastValue === value) {
                        set(result);
                    }
                });
        },
        300
    );
    return {
        trigger: ({
            api,
            value,
            error,
            set,
            measure,
        }: {
            error: boolean;
            value: string;
            api: Api;
            set: Setter;
            measure: BaseMeasure<AvailableExternalEvents>;
        }) => {
            lastValue = value;

            if (error) {
                set({ state: AsyncValidationStateValue.Idle, value, message: '' });
                abortController?.abort();
                validator.cancel();
                return;
            }

            set({ state: AsyncValidationStateValue.Loading, value, message: '' });
            validator({ value, api, set, measure });
        },
    };
};

export const defaultAsyncValidationState: AsyncValidationState = {
    state: AsyncValidationStateValue.Idle,
    value: '',
    message: '',
};
