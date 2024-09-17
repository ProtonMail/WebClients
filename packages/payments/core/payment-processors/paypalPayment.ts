import { createTokenV4 } from '@proton/shared/lib/api/payments';
import { MAX_CREDIT_AMOUNT, MIN_CREDIT_AMOUNT, MIN_PAYPAL_AMOUNT_INHOUSE } from '@proton/shared/lib/constants';
import { type Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES } from '../constants';
import { type PaymentVerificator, formatToken } from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
    V5PaymentToken,
    WrappedPaypalPayment,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

export type PaypalPaymentState = {
    fetchedPaymentToken: ChargeablePaymentToken | NonChargeablePaymentToken | null;
    verificationError: any;
    disabled: boolean;
};

export class PaypalWrongAmountError extends Error {}

export class PaypalPaymentProcessor extends PaymentProcessor<PaypalPaymentState> {
    get fetchedPaymentToken(): ChargeablePaymentToken | NonChargeablePaymentToken | null {
        return this.state.fetchedPaymentToken;
    }

    get verificationError(): any {
        return this.state.verificationError;
    }

    get disabled(): boolean {
        return this.state.disabled;
    }

    constructor(
        public verifyPayment: PaymentVerificator,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        private isCredit: boolean,
        public onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>,
        private ignoreAmountCheck?: boolean
    ) {
        super(
            {
                fetchedPaymentToken: null,
                verificationError: null,
                disabled: false,
            },
            amountAndCurrency
        );
    }

    async fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken | null> {
        if (this.amountAndCurrency.Amount === 0) {
            return null;
        }

        this.reset();
        this.updateState({
            verificationError: null,
        });

        const checkAmountResult = this.checkAmount();
        if (!checkAmountResult.isInRange) {
            throw new PaypalWrongAmountError(
                `Amount should be between ${checkAmountResult.minAmount} and ${checkAmountResult.maxAmount}. The current amount is ${checkAmountResult.currentAmount}.`
            );
        }

        let paypalToken;
        try {
            paypalToken = await this.api(
                createTokenV4({
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

        let token: V5PaymentToken;
        try {
            token = await this.verifyPayment({
                Payment: this.getPaymentParameters().Payment,
                Token: this.fetchedPaymentToken.PaymentToken,
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

    setAmountAndCurrency(amountAndCurrency: AmountAndCurrency) {
        this.amountAndCurrency = amountAndCurrency;

        const disabled = !this.checkAmount().isInRange;
        this.updateState({ disabled });
    }

    private tokenCreated(token?: V5PaymentToken): ChargeablePaymentParameters {
        const result: ChargeablePaymentParameters = {
            type: this.getType(),
            chargeable: true,
            ...this.amountAndCurrency,
            ...token,
        };

        void this.onTokenIsChargeable?.(result);

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

    private checkAmount() {
        const isInRange =
            (this.amountAndCurrency.Amount >= MIN_PAYPAL_AMOUNT_INHOUSE &&
                this.amountAndCurrency.Amount <= MAX_CREDIT_AMOUNT) ||
            // 0 is allowed because in this case we don't need to fetch token
            this.amountAndCurrency.Amount === 0 ||
            this.ignoreAmountCheck;
        return {
            isInRange,
            currentAmount: this.amountAndCurrency.Amount,
            minAmount: MIN_CREDIT_AMOUNT,
            maxAmount: MAX_CREDIT_AMOUNT,
        };
    }
}
