import { Api } from '@proton/shared/lib/interfaces';

import { CardModel, getDefaultCard, isValid, toDetails } from '../cardDetails';
import { PAYMENT_METHOD_TYPES } from '../constants';
import { PaymentVerificator, createPaymentTokenForCard } from '../createPaymentToken';
import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
    TokenPaymentMethod,
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
        public verifyPayment: PaymentVerificator,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        private onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                card: getDefaultCard(),
                cardSubmitted: false,
            },
            amountAndCurrency
        );
    }

    async fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> {
        if (!this.handleCardSubmit()) {
            throw new InvalidCardDataError();
        }

        this.fetchedPaymentToken = await createPaymentTokenForCard(
            this.getPaymentParameters(),
            this.api,
            this.amountAndCurrency
        );

        return this.fetchedPaymentToken;
    }

    async verifyPaymentToken(): Promise<ChargeablePaymentParameters> {
        if (this.amountAndCurrency.Amount === 0) {
            return this.tokenCreated();
        }

        if (this.fetchedPaymentToken === null) {
            throw new Error('Payment token was not fetched. Please call fetchPaymentToken() first.');
        }

        if (this.fetchedPaymentToken.chargeable) {
            return this.tokenCreated(this.fetchedPaymentToken);
        }

        let token: TokenPaymentMethod;
        try {
            token = await this.verifyPayment({
                Payment: this.getPaymentParameters().Payment,
                Token: this.fetchedPaymentToken.Payment.Details.Token,
                ApprovalURL: this.fetchedPaymentToken.approvalURL,
                ReturnHost: this.fetchedPaymentToken.returnHost,
            });
        } catch (error: any) {
            throw error;
        }

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
        if (this.amountAndCurrency.Amount === 0) {
            return true;
        }

        this.updateState({ cardSubmitted: true });
        if (isValid(this.state.card)) {
            return true;
        }

        return false;
    }

    private tokenCreated(token?: TokenPaymentMethod): ChargeablePaymentParameters {
        const result: ChargeablePaymentParameters = {
            type: PAYMENT_METHOD_TYPES.CARD,
            chargeable: true,
            ...this.amountAndCurrency,
            ...token,
        };

        this.onTokenIsChargeable?.(result);

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
