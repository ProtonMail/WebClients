import { c } from 'ttag';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getOwnershipVerificationHeaders, mergeHeaders } from '@proton/shared/lib/fetch/headers';
import { Api } from '@proton/shared/lib/interfaces';
import debounce from '@proton/utils/debounce';

import { BaseMeasure } from './interface';
import { AvailableExternalEvents } from './measure';

export enum EmailAsyncState {
    Idle,
    Loading,
    Success,
    Error,
    Fatal,
}

const validateEmailAvailability = async (email: string, api: Api, abortController: AbortController) => {
    try {
        await api({
            ...mergeHeaders(queryCheckEmailAvailability(email), getOwnershipVerificationHeaders('lax')),
            signal: abortController.signal,
        });

        return { state: EmailAsyncState.Success, message: '', email };
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
            throw { state: EmailAsyncState.Fatal, message, email };
        }
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw { state: EmailAsyncState.Error, message: c('Error').t`Try again later`, email };
    }
};

export interface EmailValidationState {
    state: EmailAsyncState;
    email: string;
    message: string;
}

export const createAsyncValidator = () => {
    let lastEmail = '';
    let abortController: AbortController;
    type Setter = (data: EmailValidationState) => void;

    const cache: { [key: string]: EmailValidationState } = {};

    const validator = debounce(
        ({
            email,
            api,
            set,
            measure,
        }: {
            email: string;
            api: Api;
            set: Setter;
            measure: BaseMeasure<AvailableExternalEvents>;
        }) => {
            abortController?.abort();

            if (lastEmail !== email) {
                return;
            }

            const cachedValue = cache[email];
            if (cachedValue) {
                set(cachedValue);
                return;
            }

            abortController = new AbortController();

            validateEmailAvailability(email, api, abortController)
                .then((result) => {
                    cache[email] = result;
                    if (lastEmail === email) {
                        set(result);

                        measure({
                            event: TelemetryAccountSignupEvents.beAvailableExternal,
                            dimensions: { available: 'yes' },
                        });
                    }
                })
                .catch((result: { state: EmailAsyncState; email: string; message: string }) => {
                    if (result?.state === undefined) {
                        return;
                    }
                    // Only cache actual fatal errors
                    if (result.state === EmailAsyncState.Fatal) {
                        cache[email] = result;

                        measure({
                            event: TelemetryAccountSignupEvents.beAvailableExternal,
                            dimensions: { available: 'no' },
                        });
                    }
                    if (lastEmail === email) {
                        set(result);
                    }
                });
        },
        300
    );
    return {
        trigger: ({
            api,
            email,
            error,
            set,
            measure,
        }: {
            error: boolean;
            email: string;
            api: Api;
            set: Setter;
            measure: BaseMeasure<AvailableExternalEvents>;
        }) => {
            lastEmail = email;

            if (error) {
                set({ state: EmailAsyncState.Idle, email, message: '' });
                abortController?.abort();
                validator.cancel();
                return;
            }

            set({ state: EmailAsyncState.Loading, email, message: '' });
            validator({ email, api, set, measure });
        },
    };
};

export const defaultEmailValidationState: EmailValidationState = {
    state: EmailAsyncState.Idle,
    email: '',
    message: '',
};
