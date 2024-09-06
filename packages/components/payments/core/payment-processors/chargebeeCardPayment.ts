import { c } from 'ttag';

import {
    type FormValidationErrors,
    chargebeeValidationErrorName,
    isMessageBusResponseFailure,
    paymentAttemptRefusedChargebeeErrorName,
} from '@proton/chargebee/lib';
import { type Api } from '@proton/shared/lib/interfaces';

import { type ChargebeeIframeEvents, type ChargebeeIframeHandles } from '../../core';
import { isPostalCode } from '../cardDetails';
import { PAYMENT_METHOD_TYPES } from '../constants';
import {
    type ChargebeeCardParams,
    type PaymentVerificatorV5,
    createPaymentTokenV5CreditCard,
} from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeFetchedPaymentToken,
    ForceEnableChargebee,
    V5PaymentToken,
} from '../interface';
import { InvalidDataError, PaymentProcessor } from './paymentProcessor';

export interface ChargebeeCardPaymentProcessorState {
    countryCode: string;
    postalCode: string;
    submitted: boolean;
}

export class InvalidAddressDataError extends InvalidDataError {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidAddressDataError';
    }
}

export class InvalidChargebeeCardDataError extends InvalidDataError {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidateChargebeeCardDataError';
    }
}

export class ChargebeeCardPaymentProcessor extends PaymentProcessor<ChargebeeCardPaymentProcessorState> {
    public fetchedPaymentToken: ChargebeeFetchedPaymentToken | null = null;

    get countryCode() {
        return this.state.countryCode;
    }

    get postalCode() {
        return this.state.postalCode;
    }

    constructor(
        public verifyPayment: PaymentVerificatorV5,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        private handles: ChargebeeIframeHandles,
        private events: ChargebeeIframeEvents,
        private verifyOnly: boolean,
        private forceEnableChargebee: ForceEnableChargebee,
        public onTokenIsChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                countryCode: 'US',
                postalCode: '',
                submitted: false,
            },
            amountAndCurrency
        );
    }

    async fetchPaymentToken() {
        if (this.amountAndCurrency.Amount === 0 && !this.verifyOnly) {
            return null;
        }

        await this.validateBeforeSubmit();

        const chargebeeParams: ChargebeeCardParams = {
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            amountAndCurrency: this.amountAndCurrency,
            countryCode: this.countryCode,
            zip: this.postalCode,
        };

        try {
            this.fetchedPaymentToken = await createPaymentTokenV5CreditCard(chargebeeParams, {
                api: this.api,
                handles: this.handles,
                events: this.events,
                forceEnableChargebee: this.forceEnableChargebee,
            });
        } catch (error: any) {
            // if that's not a form validation error, then we have something unexpected,
            // and we need to switch back to the old flow
            if (!this.mustIgnoreError(error)) {
                throw error;
            }
        }

        return this.fetchedPaymentToken;
    }

    async verifyPaymentToken(): Promise<ChargeableV5PaymentParameters> {
        if (this.amountAndCurrency.Amount === 0 && !this.verifyOnly) {
            return this.tokenCreated();
        }

        if (this.fetchedPaymentToken === null) {
            throw new Error('Payment token was not fetched. Please call fetchPaymentToken() first');
        }

        // We can't avoid this step, because we need to request the token status at least once
        // to make sure that it is actually chargebable
        const token = await this.verifyPayment({
            token: this.fetchedPaymentToken,
            events: this.events,
            v: 5,
            addCardMode: this.verifyOnly,
        });

        return this.tokenCreated(token);
    }

    setCountryCode(countryCode: string) {
        this.updateState({
            countryCode,
        });
    }

    setPostalCode(postalCode: string) {
        this.updateState({
            postalCode,
        });
    }

    reset() {
        this.fetchedPaymentToken = null;
    }

    isValid() {
        return Object.keys(this.getErrors()).length === 0;
    }

    getErrors() {
        const errors: Record<string, string> = {};

        if (!isPostalCode(this.postalCode)) {
            errors.postalCode = c('Error').t`Invalid postal code`;
        }

        return errors;
    }

    private async validateBeforeSubmit(): Promise<void> {
        if (this.amountAndCurrency.Amount === 0 && !this.verifyOnly) {
            return;
        }

        const isChargebeeFormValid = await this.isChargebeeFormValid();
        const outerPropsValid = this.isValid();
        this.updateState({ submitted: true });

        if (!isChargebeeFormValid) {
            throw new InvalidChargebeeCardDataError();
        }

        if (!outerPropsValid) {
            throw new InvalidAddressDataError();
        }
    }

    private tokenCreated(token?: V5PaymentToken): ChargeableV5PaymentParameters {
        const result: ChargeableV5PaymentParameters = {
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            chargeable: true,
            ...this.amountAndCurrency,
            ...token,
            v: 5,
        };

        void this.onTokenIsChargeable?.(result);

        return result;
    }

    private async validateForm(): Promise<FormValidationErrors> {
        const response = await this.handles.validateCardForm();
        if (response.status === 'failure') {
            throw new Error(response.error);
        }

        return response.data;
    }

    private async isChargebeeFormValid(): Promise<boolean> {
        const errors = await this.validateForm();
        return errors === null || Object.keys(errors).length === 0;
    }

    private mustIgnoreError(error: any): boolean {
        return (
            isMessageBusResponseFailure(error) &&
            (error.error?.name === chargebeeValidationErrorName ||
                error.error.name === paymentAttemptRefusedChargebeeErrorName)
        );
    }
}
