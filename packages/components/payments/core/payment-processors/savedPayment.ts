import { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES } from '../constants';
import { PaymentVerificator, createPaymentTokenForExistingPayment } from '../createPaymentToken';
import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
    SavedPaymentMethod,
    TokenPaymentMethod,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

interface SavedPaymentState {
    method: {
        paymentMethodId: string;
        type: PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.PAYPAL;
    };
}

export class SavedPaymentProcessor extends PaymentProcessor<SavedPaymentState> {
    public fetchedPaymentToken: ChargeablePaymentToken | NonChargeablePaymentToken | null = null;

    constructor(
        public verifyPayment: PaymentVerificator,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        savedMethod: SavedPaymentMethod,
        onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                method: {
                    paymentMethodId: savedMethod.ID,
                    type: savedMethod.Type,
                },
            },
            amountAndCurrency,
            onTokenIsChargeable
        );
    }

    async fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken | null> {
        if (this.amountAndCurrency.Amount === 0) {
            return null;
        }

        this.fetchedPaymentToken = await createPaymentTokenForExistingPayment(
            this.state.method.paymentMethodId,
            this.state.method.type,
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

        const token: TokenPaymentMethod = await this.verifyPayment({
            Token: this.fetchedPaymentToken.Payment.Details.Token,
            ApprovalURL: this.fetchedPaymentToken.approvalURL,
            ReturnHost: this.fetchedPaymentToken.returnHost,
        });

        return this.tokenCreated(token);
    }

    updateSavedMethod(savedMethod: SavedPaymentMethod) {
        this.state.method = {
            paymentMethodId: savedMethod.ID,
            type: savedMethod.Type,
        };
    }

    reset() {
        this.fetchedPaymentToken = null;
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
}
