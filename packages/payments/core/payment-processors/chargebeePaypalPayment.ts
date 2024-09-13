import { type PaymentIntent, chargebeeValidationErrorName, isMessageBusResponseFailure } from '@proton/chargebee/lib';
import { getTokenStatusV5 } from '@proton/shared/lib/api/payments';
import { type Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../constants';
import { type PaymentVerificatorV5, createPaymentTokenV5Paypal } from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargeableV5PaymentToken,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ForceEnableChargebee,
    RemoveEventListener,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

export interface ChargebeePaypalPaymentProcessorState {
    submitted: boolean;
}

export interface ChargebeePaypalModalHandles {
    onAuthorize: () => void;
    onCancel: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
}

export class ChargebeePaypalPaymentProcessor extends PaymentProcessor<ChargebeePaypalPaymentProcessorState> {
    public fetchedPaymentToken: ChargebeeFetchedPaymentToken | null = null;

    public paymentIntent: PaymentIntent | null = null;

    private removeEventListeners: RemoveEventListener[] = [];

    constructor(
        public verifyPayment: PaymentVerificatorV5,
        public api: Api,
        amountAndCurrency: AmountAndCurrency,
        private handles: ChargebeeIframeHandles,
        private events: ChargebeeIframeEvents,
        private isCredit: boolean,
        private forceEnableChargebee: ForceEnableChargebee,
        public paypalModalHandles: ChargebeePaypalModalHandles | undefined,
        public onTokenIsChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>
    ) {
        super(
            {
                submitted: false,
            },
            amountAndCurrency
        );

        (noop as any)(this.isCredit);
    }

    async fetchPaymentToken() {
        try {
            const fetchedPaymentToken = await createPaymentTokenV5Paypal(
                {
                    type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    amountAndCurrency: this.amountAndCurrency,
                    // isCredit: this.isCredit, maybe for the future to pass inside CB
                },
                {
                    api: this.api,
                    handles: this.handles,
                    events: this.events,
                    forceEnableChargebee: this.forceEnableChargebee,
                }
            );

            this.paymentIntent = fetchedPaymentToken.paymentIntent;
            this.fetchedPaymentToken = fetchedPaymentToken;
            delete (this.fetchedPaymentToken as any).paymentIntent;

            return fetchedPaymentToken;
        } catch (error) {
            // if that's not a form validation error, then we have something unexpected,
            // and we need to switch back to the old flow
            if (!this.mustIgnoreError(error)) {
                throw error;
            }
        }
    }

    // reminder for myself while working on the feature:
    // fetch token and set payment intent probably should be different methods,
    // because initializing and fetching can go in parallel, while setting payment intent should be done after the token is fetched
    async setPaypalPaymentIntent(abortSignal: AbortSignal) {
        if (!this.fetchedPaymentToken) {
            throw new Error('CB paypal: No payment token fetched');
        }

        if (!this.paymentIntent) {
            throw new Error('CB paypal: No payment intent fetched');
        }

        const authorizedListener = this.events.onPaypalAuthorized(async () => {
            this.paypalModalHandles?.onAuthorize();

            if (!this.fetchedPaymentToken) {
                return;
            }

            const token: ChargeableV5PaymentToken = {
                v: 5,
                PaymentToken: this.fetchedPaymentToken.PaymentToken,
                chargeable: true,
                ...this.amountAndCurrency,
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            };

            const { Status } = await this.api({
                ...getTokenStatusV5(token.PaymentToken),
                signal: abortSignal,
            });
            if (Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE) {
                void this.onTokenIsChargeable?.(token);
            }
        });
        this.removeEventListeners.push(authorizedListener);

        const clickListener = this.events.onPaypalClicked(() => {
            this.paypalModalHandles?.onClick();
        });
        this.removeEventListeners.push(clickListener);

        const failureListener = this.events.onPaypalFailure((error) => {
            this.paypalModalHandles?.onFailure(error);
        });
        this.removeEventListeners.push(failureListener);

        const cancelListener = this.events.onPaypalCancelled(() => {
            this.paypalModalHandles?.onCancel();
        });
        this.removeEventListeners.push(cancelListener);

        await this.handles.setPaypalPaymentIntent(
            {
                paymentIntent: this.paymentIntent,
            },
            abortSignal
        );
    }

    async verifyPaymentToken(): Promise<ChargeableV5PaymentParameters> {
        throw new Error('Not implemented');
    }

    reset() {
        this.fetchedPaymentToken = null;
        for (const removeEventListener of this.removeEventListeners) {
            removeEventListener();
        }
        this.removeEventListeners = [];
    }

    setAmountAndCurrency(amountAndCurrency: AmountAndCurrency) {
        this.amountAndCurrency = amountAndCurrency;
        this.reset();
    }

    private mustIgnoreError(error: any): boolean {
        return isMessageBusResponseFailure(error) && error.error?.name === chargebeeValidationErrorName;
    }
}
