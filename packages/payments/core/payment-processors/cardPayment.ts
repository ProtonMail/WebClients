import type { Api } from '@proton/shared/lib/interfaces';

import { type CardModel, getDefaultCard, isValid, toDetails } from '../cardDetails';
import { PAYMENT_METHOD_TYPES } from '../constants';
import { type PaymentVerificator, createPaymentTokenForCard } from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
    V5PaymentToken,
    WrappedCardPayment,
} from '../interface';
import { InvalidDataError, PaymentProcessor } from './paymentProcessor';

export interface CardPaymentProcessorState {
    cardSubmitted: boolean;
    card: CardModel;
}

export class InvalidCardDataError extends InvalidDataError {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidCardDataError';
    }
}

export class CardPaymentProcessor extends PaymentProcessor<CardPaymentProcessorState> {
    public fetchedPaymentToken: ChargeablePaymentToken | NonChargeablePaymentToken | null = null;

    get cardSubmitted() {
        return this.state.cardSubmitted;
    }

    get card() {
        return this.state.card;
    }

    constructor(
        /**
         * A function that is called when the payment token is non-chargeable. It's supposed to be used to show the
         * confirmation dialog to the user. The function is supposed to return a promise that resolves when the user
         * confirms the payment, and rejects when the user cancels the payment.
         */
        public verifyPayment: PaymentVerificator,
        public api: Api,
        /**
         * The payment token will be fetched for the specific amount and currency. Once it's changes, the
         * pre-fetched payment must be reset, and the token must be fetched again.
         */
        amountAndCurrency: AmountAndCurrency,
        /**
         * If this flag is set to `true`, then the payment token will be fetched without specifying the amount and
         * currency. This is useful when you want to verify the card without charging it. For example, when user adds a
         * card to the account, but not use it right away for subscription or top-up.
         */
        private verifyOnly: boolean,
        public onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                card: getDefaultCard(),
                cardSubmitted: false,
            },
            amountAndCurrency
        );

        this.onTokenIsChargeable = onTokenIsChargeable;
    }

    async fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken | null> {
        if (this.amountAndCurrency.Amount === 0 && !this.verifyOnly) {
            return null;
        }

        if (!this.handleCardSubmit()) {
            throw new InvalidCardDataError();
        }

        this.fetchedPaymentToken = await createPaymentTokenForCard(
            this.getPaymentParameters(),
            this.api,
            this.verifyOnly ? undefined : this.amountAndCurrency
        );

        return this.fetchedPaymentToken;
    }

    async verifyPaymentToken(): Promise<ChargeablePaymentParameters> {
        if (this.amountAndCurrency.Amount === 0 && !this.verifyOnly) {
            // The amount is 0, so there is no payment token to verify.
            // We can just return the payment parameters, and they can be charged right away.
            return this.tokenCreated();
        }

        if (this.fetchedPaymentToken === null) {
            throw new Error('Payment token was not fetched. Please call fetchPaymentToken() first.');
        }

        if (this.fetchedPaymentToken.chargeable) {
            // Is it already chargeable? Great! Then format it, mark is as ChargeablePaymentParameters, and return.
            return this.tokenCreated(this.fetchedPaymentToken);
        }

        // Otherwise, actually call the payment verificator. It will typically open a modal and/or a new tab
        // where user needs to confirm the payment.
        const token: V5PaymentToken = await this.verifyPayment({
            Payment: this.getPaymentParameters().Payment,
            Token: this.fetchedPaymentToken.PaymentToken,
            ApprovalURL: this.fetchedPaymentToken.approvalURL,
            ReturnHost: this.fetchedPaymentToken.returnHost,
            addCardMode: this.verifyOnly,
        });

        return this.tokenCreated(token);
    }

    reset() {
        this.fetchedPaymentToken = null;
    }

    updateCardProperty(key: keyof CardModel, value: string) {
        this.updateState({
            card: {
                ...this.state.card,
                [key]: value,
            },
        });
    }

    private handleCardSubmit(): boolean {
        if (this.amountAndCurrency.Amount === 0 && !this.verifyOnly) {
            return true;
        }

        this.updateState({ cardSubmitted: true });
        if (isValid(this.state.card)) {
            return true;
        }

        return false;
    }

    private tokenCreated(token?: V5PaymentToken): ChargeablePaymentParameters {
        const result: ChargeablePaymentParameters = {
            type: PAYMENT_METHOD_TYPES.CARD,
            chargeable: true,
            ...this.amountAndCurrency,
            ...token,
        };

        void this.onTokenIsChargeable?.(result);

        return result;
    }

    private getPaymentParameters(): WrappedCardPayment {
        return {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.CARD,
                Details: toDetails(this.state.card),
            },
        } as WrappedCardPayment;
    }
}
