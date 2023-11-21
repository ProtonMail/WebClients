import { queryPaymentMethodStatus, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { BLACK_FRIDAY, MIN_BITCOIN_AMOUNT, MIN_PAYPAL_AMOUNT } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';

import { isExpired as getIsExpired } from './cardDetails';
import { PAYMENT_METHOD_TYPES } from './constants';
import { AvailablePaymentMethod, PaymentMethodFlows, PaymentMethodStatus, SavedPaymentMethod } from './interface';

export class PaymentMethods {
    public get amount(): number {
        return this._amount;
    }

    public set amount(value: number) {
        this._amount = value;
    }

    public get coupon(): string {
        return this._coupon;
    }

    public set coupon(value: string) {
        this._coupon = value;
    }

    public get flow(): PaymentMethodFlows {
        return this._flow;
    }

    public set flow(value: PaymentMethodFlows) {
        this._flow = value;
    }

    constructor(
        public paymentMethodStatus: PaymentMethodStatus,
        public paymentMethods: SavedPaymentMethod[],
        private _amount: number,
        private _coupon: string,
        private _flow: PaymentMethodFlows
    ) {}

    getAvailablePaymentMethods(): { usedMethods: AvailablePaymentMethod[]; methods: AvailablePaymentMethod[] } {
        const usedMethods = this.getUsedMethods();
        const methods = this.getNewMethods();

        return {
            usedMethods,
            methods,
        };
    }

    /**
     * Formats the list of saved payment methods. It can be then used to render the list of payment methods.
     * Depending on your application, you might need to enrich the list with additional UI-specific information, e.g.
     * name of the payment method, or icon, etc.
     */
    getUsedMethods(): AvailablePaymentMethod[] {
        const usedMethods: AvailablePaymentMethod[] = this.paymentMethods
            .filter((paymentMethod) => {
                const isExistingCard =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD && this.paymentMethodStatus.Card;

                const isExistingPaypal =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL && this.paymentMethodStatus.Paypal;

                // Only Paypal and Card can be saved/used payment methods.
                // E.g. it's not possible to make Bitcoin/Cash a saved payment method.
                return isExistingCard || isExistingPaypal;
            })
            .map((paymentMethod) => {
                const isExpired =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD ? getIsExpired(paymentMethod.Details) : false;

                const method: AvailablePaymentMethod = {
                    type: paymentMethod.Type,
                    paymentMethodId: paymentMethod.ID,
                    value: paymentMethod.ID,
                    isSaved: true,
                    isExpired,
                };

                return method;
            });

        return usedMethods;
    }

    /**
     * @returns a list of new (i.e. non-saved) payment methods. Each method is individually checked for availability
     * and filtered out otherwise. The availability is controlled by the paymentMethodStatus object and by the selected
     * payment flow.
     */
    getNewMethods(): AvailablePaymentMethod[] {
        const methods: AvailablePaymentMethod[] = [
            {
                available: this.isCardAvailable(),
                type: PAYMENT_METHOD_TYPES.CARD,
                value: PAYMENT_METHOD_TYPES.CARD,
                isSaved: false,
            },
            {
                available: this.isPaypalAvailable(),
                type: PAYMENT_METHOD_TYPES.PAYPAL,
                value: PAYMENT_METHOD_TYPES.PAYPAL,
                isSaved: false,
            },
            {
                available: this.isBitcoinAvailable(),
                type: PAYMENT_METHOD_TYPES.BITCOIN,
                value: PAYMENT_METHOD_TYPES.BITCOIN,
                isSaved: false,
            },
            {
                available: this.isCashAvailable(),
                type: PAYMENT_METHOD_TYPES.CASH,
                value: PAYMENT_METHOD_TYPES.CASH,
                isSaved: false,
            },
        ]
            .filter(({ available }) => available)
            .map(({ type, value, isSaved }) => ({ type, value, isSaved }));

        return methods;
    }

    getLastUsedMethod(): AvailablePaymentMethod | undefined {
        const usedMethods = this.getUsedMethods();
        return usedMethods.length ? usedMethods[0] : undefined;
    }

    getSavedMethodById(id: string): SavedPaymentMethod | undefined {
        return this.paymentMethods.find((paymentMethod) => paymentMethod.ID === id);
    }

    private isCashAvailable() {
        const isSignup = this.flow === 'signup' || this.flow === 'signup-pass' || this.flow === 'signup-vpn';
        const isHumanVerification = this.flow === 'human-verification';

        return !isSignup && !isHumanVerification && this.coupon !== BLACK_FRIDAY.COUPON_CODE;
    }

    private isBitcoinAvailable() {
        const isSignup = this.flow === 'signup' || this.flow === 'signup-vpn'; // for signup-pass, bitcoin IS available
        const isHumanVerification = this.flow === 'human-verification';
        const isInvoice = this.flow === 'invoice';

        return (
            this.paymentMethodStatus.Bitcoin &&
            !isSignup &&
            !isHumanVerification &&
            !isInvoice &&
            this.coupon !== BLACK_FRIDAY.COUPON_CODE &&
            this.amount >= MIN_BITCOIN_AMOUNT
        );
    }

    private isPaypalAvailable() {
        const alreadyHasPayPal = this.paymentMethods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL);
        const isPaypalAmountValid = this.amount >= MIN_PAYPAL_AMOUNT;
        const isInvoice = this.flow === 'invoice';

        return this.paymentMethodStatus.Paypal && !alreadyHasPayPal && (isPaypalAmountValid || isInvoice);
    }

    private isCardAvailable() {
        return this.paymentMethodStatus.Card;
    }
}

async function getPaymentMethods(api: Api): Promise<SavedPaymentMethod[]> {
    const response = await api<{ PaymentMethods: SavedPaymentMethod[] }>(queryPaymentMethods());
    return response.PaymentMethods ?? [];
}

async function getPaymentMethodStatus(api: Api): Promise<PaymentMethodStatus> {
    return api<PaymentMethodStatus>(queryPaymentMethodStatus());
}

/**
 * Initialize payment methods object. If user is authenticated, fetches saved payment methods.
 **/
export async function initializePaymentMethods(
    api: Api,
    maybePaymentMethodStatus: PaymentMethodStatus | undefined,
    maybePaymentMethods: SavedPaymentMethod[] | undefined,
    isAuthenticated: boolean,
    amount: number,
    coupon: string,
    flow: PaymentMethodFlows
) {
    const paymentMethodStatusPromise = maybePaymentMethodStatus ?? getPaymentMethodStatus(api);
    const paymentMethodsPromise = (() => {
        if (maybePaymentMethods) {
            return maybePaymentMethods;
        }

        if (isAuthenticated) {
            return getPaymentMethods(api);
        }

        return [];
    })();

    const [paymentMethodStatus, paymentMethods] = await Promise.all([
        paymentMethodStatusPromise,
        paymentMethodsPromise,
    ]);

    return new PaymentMethods(paymentMethodStatus, paymentMethods, amount, coupon, flow);
}
