import { createToken } from '@proton/shared/lib/api/payments';
import { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES } from '../constants';
import { PaymentVerificator, formatToken } from '../createPaymentToken';
import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
    TokenPaymentMethod,
    WrappedPaypalPayment,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

export type PaypalPaymentState = {
    fetchedPaymentToken: ChargeablePaymentToken | NonChargeablePaymentToken | null;
    verificationError: any;
};

export class PaypalPaymentProcessor extends PaymentProcessor<PaypalPaymentState> {
    get fetchedPaymentToken(): ChargeablePaymentToken | NonChargeablePaymentToken | null {
        return this.state.fetchedPaymentToken;
    }

    get verificationError(): any {
        return this.state.verificationError;
    }

    constructor(
        public verifyPayment: PaymentVerificator,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        private isCredit: boolean,
        private onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                fetchedPaymentToken: null,
                verificationError: null,
            },
            amountAndCurrency
        );
    }

    async fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> {
        this.reset();
        this.updateState({
            verificationError: null,
        });

        let paypalToken;
        try {
            paypalToken = await this.api(
                createToken({
                    ...this.amountAndCurrency,
                    Payment: {
                        Type: this.getType(),
                    },
                })
            );
        } catch (error: any) {
            this.updateState({
                verificationError: error,
            });
            throw error;
        }

        const fetchedPaymentToken = formatToken(paypalToken, this.getType(), this.amountAndCurrency);
        this.updateState({
            fetchedPaymentToken,
        });

        return fetchedPaymentToken;
    }

    async verifyPaymentToken(): Promise<ChargeablePaymentParameters> {
        if (this.amountAndCurrency.Amount === 0) {
            return this.tokenCreated();
        }

        if (this.fetchedPaymentToken === null) {
            throw new Error('Payment token is not fetched');
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
            this.updateState({
                verificationError: new Error('Paypal payment verification failed'),
            });
            throw error;
        }

        return this.tokenCreated(token);
    }

    reset() {
        this.updateState({
            fetchedPaymentToken: null,
        });
    }

    private tokenCreated(token?: TokenPaymentMethod): ChargeablePaymentParameters {
        const result: ChargeablePaymentParameters = {
            type: this.getType(),
            chargeable: true,
            ...this.amountAndCurrency,
            ...token,
        };

        this.onTokenIsChargeable?.(result);

        return result;
    }

    private getPaymentParameters(): WrappedPaypalPayment {
        return {
            Payment: {
                Type: this.getType(),
            },
        } as WrappedPaypalPayment;
    }

    private getType(): PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT {
        return this.isCredit ? PAYMENT_METHOD_TYPES.PAYPAL_CREDIT : PAYMENT_METHOD_TYPES.PAYPAL;
    }
}
