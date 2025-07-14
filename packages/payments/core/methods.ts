import { isSafari } from '@proton/shared/lib/helpers/browser';
import type { Api, ChargebeeUserExists, User } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { isDelinquent } from '@proton/shared/lib/user/helpers';
import orderBy from '@proton/utils/orderBy';

import { getPaymentMethods } from './api';
import { type BillingAddress } from './billing-address';
import { isExpired as getIsExpired } from './cardDetails';
import {
    type ADDON_NAMES,
    MIN_APPLE_PAY_AMOUNT,
    MIN_BITCOIN_AMOUNT,
    MIN_PAYPAL_AMOUNT_CHARGEBEE,
    MIN_PAYPAL_AMOUNT_INHOUSE,
    MethodStorage,
    PAYMENT_METHOD_TYPES,
    PLANS,
} from './constants';
import { extendStatus, isSignupFlow } from './helpers';
import type {
    AvailablePaymentMethod,
    Currency,
    FreeSubscription,
    PaymentMethodApplePay,
    PaymentMethodFlow,
    PaymentMethodStatus,
    PaymentMethodStatusExtended,
    PaymentsApi,
    PlainPaymentMethodType,
    PlanIDs,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
} from './interface';
import type { PaymentMethodSepa } from './interface';
import { getIsB2BAudienceFromPlan } from './plan/helpers';
import { type BillingPlatform } from './subscription/constants';
import { getHas2024OfferCoupon } from './subscription/helpers';
import { type Subscription } from './subscription/interface';
import { isFreeSubscription } from './type-guards';
import { isOnSessionMigration, isSplittedUser } from './utils';

// SEPA helper. Can be removed if the API consistently returns the type of save SEPA in both cases: GET events and GET methods

function isSavedPaymentMethodSepa(obj: any): obj is PaymentMethodSepa {
    return (
        obj.Type === 'sepa-direct-debit' ||
        obj.Type === 'sepadirectdebit' ||
        (obj.Type === 'sepa_direct_debit' && !!obj.Details)
    );
}

function isSavedPaymentMethodApplePay(obj: any): obj is PaymentMethodApplePay {
    return (obj.Type === 'applepay' || obj.Type === PAYMENT_METHOD_TYPES.APPLE_PAY) && !!obj.Details;
}

export function formatPaymentMethod(method: SavedPaymentMethod): SavedPaymentMethod {
    if (isSavedPaymentMethodSepa(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        } as PaymentMethodSepa;
    }

    if (isSavedPaymentMethodApplePay(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.APPLE_PAY,
        } as PaymentMethodApplePay;
    }

    return method;
}
export function markDefaultPaymentMethod(paymentMethods: SavedPaymentMethod[]): SavedPaymentMethod[] {
    if (!paymentMethods || paymentMethods.length === 0) {
        return paymentMethods;
    }

    const sortedPaymentMethods = orderBy(paymentMethods, 'Order');

    return sortedPaymentMethods.map(
        (paymentMethod, index) =>
            ({
                ...paymentMethod,
                IsDefault: index === 0,
            }) as SavedPaymentMethod
    );
}

export function formatPaymentMethods(paymentMethods: SavedPaymentMethod[]): SavedPaymentMethod[] {
    return markDefaultPaymentMethod(paymentMethods.map(formatPaymentMethod));
}

export interface PaymentMethodsParameters {
    paymentMethodStatus: PaymentMethodStatusExtended | PaymentMethodStatus;
    paymentMethods: SavedPaymentMethod[];
    chargebeeEnabled: ChargebeeEnabled;
    amount: number;
    currency: Currency;
    coupon: string;
    flow: PaymentMethodFlow;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingPlatform?: BillingPlatform;
    chargebeeUserExists?: ChargebeeUserExists;
    billingAddress?: BillingAddress;
    enableSepa?: boolean;
    enableSepaB2C?: boolean;
    user?: User;
    planIDs?: PlanIDs;
    subscription?: Subscription | FreeSubscription;
    canUseApplePay?: boolean;
    enableApplePay?: boolean;
}

const sepaCountries = new Set([
    // EU Member States
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    // Additional SEPA Members
    'IS',
    'LI',
    'NO',
    'CH',
    'GB',
    'AD',
    'MC',
    'SM',
    'VA',
]);

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

    public get flow(): PaymentMethodFlow {
        return this._flow;
    }

    public set flow(value: PaymentMethodFlow) {
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

    public set statusExtended(value: PaymentMethodStatusExtended) {
        this._statusExtended = value;
    }

    public paymentMethods: SavedPaymentMethod[];

    public chargebeeEnabled: ChargebeeEnabled;

    private _amount: number;

    public currency: Currency;

    private _coupon: string;

    private _flow: PaymentMethodFlow;

    private _selectedPlanName: PLANS | ADDON_NAMES | undefined;

    public billingPlatform: BillingPlatform | undefined;

    public chargebeeUserExists: ChargebeeUserExists | undefined;

    public billingAddress: BillingAddress | undefined;

    public enableSepa: boolean;

    public enableSepaB2C: boolean;

    public user: User | undefined;

    public planIDs: PlanIDs | undefined;

    public subscription: Subscription | FreeSubscription | undefined;

    public readonly directDebitEnabledFlows: readonly PaymentMethodFlow[] = [
        'signup',
        'signup-pass',
        'signup-pass-upgrade',
        'signup-wallet',
        'signup-v2',
        'signup-v2-upgrade',
        'signup-vpn',
        'subscription',
    ];

    public canUseApplePay: boolean;

    public enableApplePay: boolean;

    constructor({
        paymentMethodStatus,
        paymentMethods,
        chargebeeEnabled,
        amount,
        currency,
        coupon,
        flow,
        selectedPlanName,
        billingPlatform,
        chargebeeUserExists,
        billingAddress,
        enableSepa,
        enableSepaB2C,
        user,
        planIDs,
        subscription,
        canUseApplePay,
        enableApplePay,
    }: PaymentMethodsParameters) {
        this._statusExtended = extendStatus(paymentMethodStatus);

        this.paymentMethods = paymentMethods;
        this.chargebeeEnabled = chargebeeEnabled;
        this._amount = amount;
        this.currency = currency;
        this._coupon = coupon;
        this._flow = flow;
        this._selectedPlanName = selectedPlanName;
        this.billingPlatform = billingPlatform;
        this.chargebeeUserExists = chargebeeUserExists;
        this.billingAddress = billingAddress;
        this.enableSepa = !!enableSepa;
        this.enableSepaB2C = !!enableSepaB2C;
        this.user = user;
        this.planIDs = planIDs;
        this.subscription = subscription;
        this.canUseApplePay = !!canUseApplePay;
        this.enableApplePay = !!enableApplePay;
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

                const isExistingChargebeeSepaDirectDebit =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT &&
                    this.statusExtended.VendorStates.Card &&
                    this.paymentFlowSupportsSEPADirectDebit();

                const isExistingApplePay =
                    paymentMethod.Type === PAYMENT_METHOD_TYPES.APPLE_PAY && this.statusExtended.VendorStates.Apple;

                // Only Paypal and Card can be saved/used payment methods.
                // E.g. it's not possible to make Bitcoin/Cash a saved payment method.
                return (
                    isExistingCard ||
                    isExistingPaypal ||
                    isExistingChargebeeCard ||
                    isExistingChargebeePaypal ||
                    isExistingChargebeeSepaDirectDebit ||
                    isExistingApplePay
                );
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
                    isDefault: !!paymentMethod.IsDefault,
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
                available: this.isSEPADirectDebitAvailable(),
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            },
            {
                available: this.isCashAvailable(),
                type: PAYMENT_METHOD_TYPES.CASH,
            },
            {
                available: this.isApplePayAvailable(),
                type: PAYMENT_METHOD_TYPES.APPLE_PAY,
            },
        ]
            .filter(({ available }) => available)
            .map(({ type }) => ({ type, value: type, isSaved: false, isDefault: false }));

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
            case PAYMENT_METHOD_TYPES.APPLE_PAY:
                return this.isApplePayAvailable();
            default:
                return false;
        }
    }

    private isCashAvailable(): boolean {
        return (
            this.statusExtended.VendorStates.Cash && !isSignupFlow(this.flow) && !this.isBF2024Offer() && !this.coupon
        );
    }

    private paymentFlowSupportsSEPADirectDebit(): boolean {
        return this.directDebitEnabledFlows.includes(this.flow);
    }

    private isSEPADirectDebitAvailable(): boolean {
        if (!this.enableSepa) {
            return false;
        }

        const flowSupportsDirectDebit = this.paymentFlowSupportsSEPADirectDebit();

        const billingCountrySupportsSEPA = this.billingAddress?.CountryCode
            ? sepaCountries.has(this.billingAddress.CountryCode)
            : false;

        const cbUser = this.chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED;

        return (
            flowSupportsDirectDebit &&
            billingCountrySupportsSEPA &&
            cbUser &&
            !this.isBF2024Offer() &&
            // separate flag for B2C plans
            (this.isB2BPlan() || this.enableSepaB2C)
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
        const btcEnabledFlows: PaymentMethodFlow[] = [
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'credit',
            'subscription',
        ];

        const flowSupportsBtc = btcEnabledFlows.includes(this.flow);

        const passLifetimeBuyerWithCreditBalance = (this.user?.Credit ?? 0) > 0 && this.buysPassLifetime();
        const passLifetimeBuyerWithActiveSubscription =
            !!this.subscription &&
            !isFreeSubscription(this.subscription) &&
            this.subscription.Currency !== this.currency &&
            this.buysPassLifetime();
        const btcDisabledSpecialCases = passLifetimeBuyerWithCreditBalance || passLifetimeBuyerWithActiveSubscription;

        const notDelinquent = !this.user || !isDelinquent(this.user);

        return (
            this.statusExtended.VendorStates.Bitcoin &&
            flowSupportsBtc &&
            this.amount >= MIN_BITCOIN_AMOUNT &&
            !this.isB2BPlan() &&
            !btcDisabledSpecialCases &&
            (notDelinquent || this.flow === 'credit')
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

    private isApplePayAvailable(): boolean {
        const flows = [
            'signup',
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'signup-v2',
            'signup-v2-upgrade',
            'signup-vpn',
            'subscription',
        ] as PaymentMethodFlow[];
        const isAllowedFlow = flows.includes(this.flow);

        const isApplePayAmountValid = this.amount >= MIN_APPLE_PAY_AMOUNT;

        return (
            this.statusExtended.VendorStates.Apple &&
            this.enableApplePay &&
            isApplePayAmountValid &&
            isAllowedFlow &&
            this.canUseApplePay &&
            isSafari()
        );
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

    private buysPassLifetime() {
        return !!this.planIDs?.[PLANS.PASS_LIFETIME];
    }

    private isBF2024Offer() {
        return getHas2024OfferCoupon(this.coupon) || this.buysPassLifetime();
    }
}

/**
 * Initialize payment methods object. If user is authenticated, fetches saved payment methods.
 **/
export async function initializePaymentMethods({
    maybePaymentMethodStatus,
    paymentsApi,
    maybePaymentMethods,
    isAuthenticated,
    api,
    ...props
}: {
    api: Api;
    maybePaymentMethodStatus: PaymentMethodStatusExtended | undefined;
    maybePaymentMethods: SavedPaymentMethod[] | undefined;
    isAuthenticated: boolean;
    amount: number;
    currency: Currency;
    coupon: string;
    flow: PaymentMethodFlow;
    chargebeeEnabled: ChargebeeEnabled;
    paymentsApi: PaymentsApi;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingPlatform?: BillingPlatform;
    chargebeeUserExists?: ChargebeeUserExists;
    billingAddress?: BillingAddress;
    enableSepa?: boolean;
    enableSepaB2C?: boolean;
    user?: User;
    planIDs?: PlanIDs;
    subscription?: Subscription;
    canUseApplePay?: boolean;
    enableApplePay?: boolean;
}) {
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

    const mappedMethods = paymentMethods.map(formatPaymentMethod).map((it: SavedPaymentMethod) => {
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

    return new PaymentMethods({
        paymentMethodStatus,
        paymentMethods: mappedMethods,
        ...props,
    });
}
