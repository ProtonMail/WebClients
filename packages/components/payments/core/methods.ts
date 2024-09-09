import { queryPaymentMethods } from '@proton/shared/lib/api/payments';
import type { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';
import {
    BLACK_FRIDAY,
    MIN_BITCOIN_AMOUNT,
    MIN_PAYPAL_AMOUNT_CHARGEBEE,
    MIN_PAYPAL_AMOUNT_INHOUSE,
} from '@proton/shared/lib/constants';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import type { Api, BillingPlatform, ChargebeeUserExists } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { isExpired as getIsExpired } from './cardDetails';
import { PAYMENT_METHOD_TYPES } from './constants';
import type {
    AvailablePaymentMethod,
    PaymentMethodFlows,
    PaymentMethodStatus,
    PaymentMethodStatusExtended,
    PaymentsApi,
    PlainPaymentMethodType,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
} from './interface';
import { MethodStorage, extendStatus, isSignupFlow } from './interface';
import { isOnSessionMigration, isSplittedUser } from './utils';

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

    public get selectedPlanName(): PLANS | ADDON_NAMES | undefined {
        return this._selectedPlanName;
    }

    public set selectedPlanName(value: PLANS | ADDON_NAMES | undefined) {
        this._selectedPlanName = value;
    }

    private _statusExtended: PaymentMethodStatusExtended;

    public get statusExtended(): PaymentMethodStatusExtended {
        return this._statusExtended;
    }

    constructor(
        paymentMethodStatus: PaymentMethodStatus | PaymentMethodStatusExtended,
        public paymentMethods: SavedPaymentMethod[],
        public chargebeeEnabled: ChargebeeEnabled,
        private _amount: number,
        private _coupon: string,
        private _flow: PaymentMethodFlows,
        private _selectedPlanName: PLANS | ADDON_NAMES | undefined,
        public billingPlatform: BillingPlatform | undefined,
        public chargebeeUserExists: ChargebeeUserExists | undefined,
        public disableNewPaymentMethods: boolean
    ) {
        this._statusExtended = extendStatus(paymentMethodStatus);
    }

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
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CARD && this.statusExtended.VendorStates.Card;

                const isExistingChargebeeCard =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && this.statusExtended.VendorStates.Card;

                const isExistingPaypal =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.PAYPAL && this.statusExtended.VendorStates.Paypal;

                const isExistingChargebeePaypal =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL &&
                    this.statusExtended.VendorStates.Paypal;

                // Only Paypal and Card can be saved/used payment methods.
                // E.g. it's not possible to make Bitcoin/Cash a saved payment method.
                return isExistingCard || isExistingPaypal || isExistingChargebeeCard || isExistingChargebeePaypal;
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
        if (this.disableNewPaymentMethods) {
            return [];
        }

        const methods: AvailablePaymentMethod[] = [
            {
                available: this.isCardAvailable(),
                type: PAYMENT_METHOD_TYPES.CARD,
            },
            {
                available: this.isChargebeeCardAvailable(),
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            },
            {
                available: this.isPaypalAvailable(),
                type: PAYMENT_METHOD_TYPES.PAYPAL,
            },
            {
                available: this.isChargebeePaypalAvailable(),
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            },
            {
                available: this.isBitcoinAvailable(),
                type: PAYMENT_METHOD_TYPES.BITCOIN,
            },
            {
                available: this.isChargebeeBitcoinAvailable(),
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            },
            {
                available: this.isCashAvailable(),
                type: PAYMENT_METHOD_TYPES.CASH,
            },
        ]
            .filter(({ available }) => available)
            .map(({ type }) => ({ type, value: type, isSaved: false }));

        return methods;
    }

    getLastUsedMethod(): AvailablePaymentMethod | undefined {
        const usedMethods = this.getUsedMethods();
        return usedMethods.length ? usedMethods[0] : undefined;
    }

    getSavedMethodById(id: string): SavedPaymentMethod | undefined {
        return this.paymentMethods.find((paymentMethod) => paymentMethod.ID === id);
    }

    isMethodTypeEnabled(methodType: PlainPaymentMethodType): boolean {
        switch (methodType) {
            case PAYMENT_METHOD_TYPES.CARD:
                return this.isCardAvailable();
            case PAYMENT_METHOD_TYPES.PAYPAL:
                return this.isPaypalAvailable();
            case PAYMENT_METHOD_TYPES.BITCOIN:
                return this.isBitcoinAvailable();
            case PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN:
                return this.isChargebeeBitcoinAvailable();
            case PAYMENT_METHOD_TYPES.CASH:
                return this.isCashAvailable();
            case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
                return this.isChargebeeCardAvailable();
            case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
                return this.isChargebeePaypalAvailable();
            default:
                return false;
        }
    }

    private isCashAvailable(): boolean {
        return (
            this.statusExtended.VendorStates.Cash &&
            !isSignupFlow(this.flow) &&
            this.coupon !== BLACK_FRIDAY.COUPON_CODE
        );
    }

    private isBitcoinAvailable(): boolean {
        return this.commonBtcConditions() && !this.isChargebeeBitcoinAvailable();
    }

    private isChargebeeBitcoinAvailable(): boolean {
        if (this.chargebeeEnabled === ChargebeeEnabled.INHOUSE_FORCED || this.chargebeeMethodsDisabled()) {
            return false;
        }

        return this.commonBtcConditions() && this.chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED;
    }

    private commonBtcConditions() {
        const btcEnabledFlows: PaymentMethodFlows[] = ['signup-pass', 'signup-pass-upgrade', 'credit', 'subscription'];

        const flowSupportsBtc = btcEnabledFlows.includes(this.flow);

        return (
            this.statusExtended.VendorStates.Bitcoin &&
            flowSupportsBtc &&
            this.coupon !== BLACK_FRIDAY.COUPON_CODE &&
            this.amount >= MIN_BITCOIN_AMOUNT &&
            !this.isB2BPlan()
        );
    }

    private isCardAvailable(): boolean {
        if (!this.statusExtended.VendorStates.Card) {
            return false;
        }

        return !this.isChargebeeCardAvailable();
    }

    private isChargebeeCardAvailable(): boolean {
        if (this.chargebeeEnabled === ChargebeeEnabled.INHOUSE_FORCED || this.chargebeeMethodsDisabled()) {
            return false;
        }

        const cardAvailable = this.statusExtended.VendorStates.Card;
        if (this.chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED) {
            return cardAvailable;
        }

        const isAddCard = this.flow === 'add-card';
        const isSubscription = this.flow === 'subscription';
        const isCredit = this.flow === 'credit';
        const isAllowedFlow = isSignupFlow(this.flow) || isAddCard || isSubscription || isCredit;

        return cardAvailable && isAllowedFlow;
    }

    private isPaypalAvailable(): boolean {
        const alreadyHasPayPal = this.paymentMethods.some(
            ({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL || Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
        );
        const isPaypalAmountValid = this.amount >= MIN_PAYPAL_AMOUNT_INHOUSE;
        const isInvoice = this.flow === 'invoice';

        return (
            this.statusExtended.VendorStates.Paypal &&
            !alreadyHasPayPal &&
            (isPaypalAmountValid || isInvoice) &&
            !this.isChargebeePaypalAvailable()
        );
    }

    private isChargebeePaypalAvailable(): boolean {
        if (this.chargebeeEnabled === ChargebeeEnabled.INHOUSE_FORCED || this.chargebeeMethodsDisabled()) {
            return false;
        }

        const alreadyHasPayPal = this.paymentMethods.some(
            ({ Type }) => Type === PAYMENT_METHOD_TYPES.PAYPAL || Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
        );

        const isPaypalAmountValid = this.amount >= MIN_PAYPAL_AMOUNT_CHARGEBEE;
        const isInvoice = this.flow === 'invoice';

        const paypalAvailable =
            this.statusExtended.VendorStates.Paypal && !alreadyHasPayPal && (isPaypalAmountValid || isInvoice);
        if (this.chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED) {
            return paypalAvailable;
        }

        const isSubscription = this.flow === 'subscription';
        const isCredit = this.flow === 'credit';
        const isAllowedFlow = isSubscription || isSignupFlow(this.flow) || isCredit;

        return paypalAvailable && isAllowedFlow;
    }

    private isB2BPlan(): boolean {
        return this.selectedPlanName ? getIsB2BAudienceFromPlan(this.selectedPlanName) : false;
    }

    private isOnSessionMigration() {
        return isOnSessionMigration(this.chargebeeEnabled, this.billingPlatform);
    }

    private isSplittedUser() {
        return isSplittedUser(this.chargebeeEnabled, this.chargebeeUserExists, this.billingPlatform);
    }

    private chargebeeMethodsDisabled() {
        const isAddCard = this.flow === 'add-card';
        const isCredit = this.flow === 'credit';
        return (isAddCard || isCredit) && this.isOnSessionMigration() && !this.isSplittedUser();
    }
}

async function getPaymentMethods(api: Api): Promise<SavedPaymentMethod[]> {
    const response = await api<{ PaymentMethods: SavedPaymentMethod[] }>(queryPaymentMethods());
    return response.PaymentMethods ?? [];
}

/**
 * Initialize payment methods object. If user is authenticated, fetches saved payment methods.
 **/
export async function initializePaymentMethods(
    api: Api,
    maybePaymentMethodStatus: PaymentMethodStatusExtended | undefined,
    maybePaymentMethods: SavedPaymentMethod[] | undefined,
    isAuthenticated: boolean,
    amount: number,
    coupon: string,
    flow: PaymentMethodFlows,
    chargebeeEnabled: ChargebeeEnabled,
    paymentsApi: PaymentsApi,
    selectedPlanName: PLANS | ADDON_NAMES | undefined,
    billingPlatform?: BillingPlatform,
    chargebeeUserExists?: ChargebeeUserExists,
    disableNewPaymentMethods?: boolean
) {
    const paymentMethodStatusPromise = maybePaymentMethodStatus ?? paymentsApi.statusExtendedAutomatic();
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

    const mappedMethods = paymentMethods.map((it: SavedPaymentMethod) => {
        if (it.External !== MethodStorage.EXTERNAL) {
            return it;
        }

        let Type = it.Type;
        if (Type === PAYMENT_METHOD_TYPES.CARD) {
            Type = PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
        } else if (Type === PAYMENT_METHOD_TYPES.PAYPAL) {
            Type = PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
        }

        return {
            ...it,
            Type,
        } as SavedPaymentMethodExternal;
    });

    return new PaymentMethods(
        paymentMethodStatus,
        mappedMethods,
        chargebeeEnabled,
        amount,
        coupon,
        flow,
        selectedPlanName,
        billingPlatform,
        chargebeeUserExists,
        !!disableNewPaymentMethods
    );
}
