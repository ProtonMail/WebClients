import { type Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES } from '../constants';
import { type PaymentVerificator, createPaymentTokenForExistingPayment } from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
    V5PaymentToken,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

interface SavedPaymentState {
    method: {
        paymentMethodId: string;
        type: PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.PAYPAL;
    };
}

function convertType(
    type:
        | PAYMENT_METHOD_TYPES.CARD
        | PAYMENT_METHOD_TYPES.PAYPAL
        | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
        | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
): PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.PAYPAL {
    switch (type) {
        case PAYMENT_METHOD_TYPES.CARD:
        case PAYMENT_METHOD_TYPES.PAYPAL:
            return type;
        case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
            return PAYMENT_METHOD_TYPES.CARD;
        case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
            return PAYMENT_METHOD_TYPES.PAYPAL;
    }
}

export class SavedPaymentProcessor extends PaymentProcessor<SavedPaymentState> {
    public fetchedPaymentToken: ChargeablePaymentToken | NonChargeablePaymentToken | null = null;

    constructor(
        public verifyPayment: PaymentVerificator,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        savedMethod: SavedPaymentMethodInternal | SavedPaymentMethodExternal | SavedPaymentMethod,
        public onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                method: {
                    paymentMethodId: savedMethod.ID,
                    type: convertType(savedMethod.Type),
                },
            },
            amountAndCurrency
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

        const token: V5PaymentToken = await this.verifyPayment({
            Token: this.fetchedPaymentToken.PaymentToken,
            ApprovalURL: this.fetchedPaymentToken.approvalURL,
            ReturnHost: this.fetchedPaymentToken.returnHost,
        });

        return this.tokenCreated(token);
    }

    updateSavedMethod(savedMethod: SavedPaymentMethodInternal | SavedPaymentMethodExternal | SavedPaymentMethod) {
        this.state.method = {
            paymentMethodId: savedMethod.ID,
            type: convertType(savedMethod.Type),
        };
    }

    reset() {
        this.fetchedPaymentToken = null;
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
}
