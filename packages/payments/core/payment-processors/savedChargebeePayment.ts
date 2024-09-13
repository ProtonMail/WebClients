import { type Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES } from '../constants';
import { type PaymentVerificatorV5, createPaymentTokenForExistingChargebeePayment } from '../createPaymentToken';
import type { ChargebeeIframeEvents, ChargebeeIframeHandles } from '../interface';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeableV5PaymentParameters,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
    V5PaymentToken,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

interface SavedChargebeePaymentState {
    method: {
        paymentMethodId: string;
        type:
            | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
            | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            | PAYMENT_METHOD_TYPES.CARD
            | PAYMENT_METHOD_TYPES.PAYPAL;
    };
}

export class SavedChargebeePaymentProcessor extends PaymentProcessor<SavedChargebeePaymentState> {
    public fetchedPaymentToken: any;

    constructor(
        public verifyPayment: PaymentVerificatorV5,
        public api: Api,
        public handles: ChargebeeIframeHandles,
        public events: ChargebeeIframeEvents,
        amountAndCurrency: AmountAndCurrency,
        /**
         * For the on-session v4-v5 migration, the saved payment method can also be internal.
         * In this case the frontend will send the internal saved method to v5 and the backend will do the migration.
         */
        savedMethod: SavedPaymentMethodExternal | SavedPaymentMethodInternal | SavedPaymentMethod,
        public onTokenIsChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                method: {
                    paymentMethodId: savedMethod.ID,
                    type: savedMethod.Type,
                },
            },
            amountAndCurrency
        );
    }

    async fetchPaymentToken() {
        if (this.amountAndCurrency.Amount === 0) {
            return null;
        }

        this.fetchedPaymentToken = await createPaymentTokenForExistingChargebeePayment(
            this.state.method.paymentMethodId,
            this.state.method.type,
            this.api,
            this.handles,
            this.events,
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

        // We can't avoid this step, because we need to request the token status at least once
        // to make sure that it is actually chargebable
        const token = await this.verifyPayment({
            token: this.fetchedPaymentToken,
            events: this.events,
            v: 5,
        });

        return this.tokenCreated(token);
    }

    updateSavedMethod(savedMethod: SavedPaymentMethodExternal | SavedPaymentMethodInternal | SavedPaymentMethod) {
        this.state.method = {
            paymentMethodId: savedMethod.ID,
            type: savedMethod.Type,
        };
    }

    reset() {
        this.fetchedPaymentToken = null;
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

    // private tokenCreated(token?: V5PaymentToken): ChargeablePaymentParameters {
    //     const result: ChargeablePaymentParameters = {
    //         type: PAYMENT_METHOD_TYPES.CARD,
    //         chargeable: true,
    //         ...this.amountAndCurrency,
    //         ...token,
    //     };

    //     void this.onTokenIsChargeable?.(result);

    //     return result;
    // }
}
