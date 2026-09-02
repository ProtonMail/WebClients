import type { User } from '@proton/shared/lib/interfaces';
import { isDelinquent } from '@proton/shared/lib/user/helpers';

import {
    getMinApplePayAmount,
    getMinBitcoinAmount,
    getMinGooglePayAmount,
    getMinPaypalAmountChargebee,
} from '../amount-limits';
import type { BillingAddress } from '../billing-address/billing-address';
import { isCardExpired } from '../cardDetails';
import { type ADDON_NAMES, PAYMENT_METHOD_TYPES, PLANS } from '../constants';
import { isSignupFlow } from '../helpers';
import type {
    AvailablePaymentMethod,
    Currency,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentStatus,
    PlainPaymentMethodType,
    PlanIDs,
    SavedPaymentMethod,
} from '../interface';
import { getIsB2BAudienceFromPlan } from '../plan/helpers';
import { getHas2025OfferCoupon } from '../subscription/helpers';
import type { Subscription } from '../subscription/interface';
import { isFreeSubscription } from '../type-guards';

export type PaymentMethodsContext = {
    paymentStatus: PaymentStatus;
    paymentMethods: SavedPaymentMethod[];
    amount: number;
    currency: Currency;
    coupon: string;
    flow: PaymentMethodFlow;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    billingAddress?: BillingAddress;
    enableSepa?: boolean;
    enableSepaB2C?: boolean;
    user?: User;
    planIDs?: PlanIDs;
    subscription?: Subscription | FreeSubscription;
    canUseApplePay?: boolean;
    canUseGooglePay?: boolean;
    isTrial?: boolean;
    enablePaypalRegionalCurrenciesBatch3?: boolean;
    enablePaypalKrw?: boolean;
    enableIdeal?: boolean;
};

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

const directDebitEnabledFlows: PaymentMethodFlow[] = [
    'signup',
    'signup-pass',
    'signup-pass-upgrade',
    'signup-wallet',
    'signup-v2',
    'signup-v2-upgrade',
    'signup-vpn',
    'subscription',
];

const bitcoinEnabledFlows: PaymentMethodFlow[] = [
    'signup-pass',
    'signup-pass-upgrade',
    'signup-wallet',
    'credit',
    'subscription',
];

const applePayEnabledFlows: PaymentMethodFlow[] = [
    'signup',
    'signup-pass',
    'signup-pass-upgrade',
    'signup-wallet',
    'signup-v2',
    'signup-v2-upgrade',
    'signup-vpn',
    'subscription',
];

const googlePayEnabledFlows: PaymentMethodFlow[] = [...applePayEnabledFlows, 'reservation-donation'];

const isB2BPlan = ({ selectedPlanName }: PaymentMethodsContext) =>
    selectedPlanName ? getIsB2BAudienceFromPlan(selectedPlanName) : false;

const buysPassLifetime = ({ planIDs }: PaymentMethodsContext) => !!planIDs?.[PLANS.PASS_LIFETIME];

const isBF2025Offer = ({ coupon }: PaymentMethodsContext) => getHas2025OfferCoupon(coupon);

const flowSupportsSepaDirectDebit = ({ flow }: PaymentMethodsContext) => directDebitEnabledFlows.includes(flow);

const isChargebeeCardAvailable = ({ paymentStatus }: PaymentMethodsContext) => paymentStatus.VendorStates.Card;

// hide Paypal until Braintree enables new regional currencies
const newPaypalRegionalCurrencies: Currency[] = ['HKD', 'SGD', 'JPY', 'PLN'];

const isChargebeePaypalAvailable = (context: PaymentMethodsContext) => {
    const { paymentStatus, paymentMethods, amount, currency, flow, isTrial } = context;

    const alreadyHasPayPal = paymentMethods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);

    const isPaypalAmountValid = amount >= getMinPaypalAmountChargebee(currency);
    const isInvoice = flow === 'invoice';

    const isNewCurrency = newPaypalRegionalCurrencies.includes(currency);

    // KRW has a separate flag because it requires additional support from PayPal
    const isKrwCurrency = currency === 'KRW';

    return (
        paymentStatus.VendorStates.Paypal &&
        !alreadyHasPayPal &&
        (isPaypalAmountValid || isInvoice) &&
        !isTrial &&
        (!isNewCurrency || !!context.enablePaypalRegionalCurrenciesBatch3) &&
        (!isKrwCurrency || !!context.enablePaypalKrw)
    );
};

const isChargebeeBitcoinAvailable = (context: PaymentMethodsContext) => {
    const { paymentStatus, amount, currency, flow, user, subscription, isTrial } = context;

    const passLifetimeBuyerWithCreditBalance = (user?.Credit ?? 0) > 0 && buysPassLifetime(context);
    const passLifetimeBuyerWithActiveSubscription =
        !!subscription &&
        !isFreeSubscription(subscription) &&
        subscription.Currency !== currency &&
        buysPassLifetime(context);
    const btcDisabledSpecialCases = passLifetimeBuyerWithCreditBalance || passLifetimeBuyerWithActiveSubscription;

    const notDelinquent = !user || !isDelinquent(user);

    return (
        paymentStatus.VendorStates.Bitcoin &&
        bitcoinEnabledFlows.includes(flow) &&
        amount >= getMinBitcoinAmount(currency) &&
        !isB2BPlan(context) &&
        !btcDisabledSpecialCases &&
        (notDelinquent || flow === 'credit') &&
        !isTrial
    );
};

const isSepaDirectDebitAvailable = (context: PaymentMethodsContext) => {
    const { billingAddress, enableSepa, enableSepaB2C, isTrial } = context;

    if (!enableSepa) {
        return false;
    }

    const billingCountrySupportsSEPA = billingAddress?.CountryCode
        ? sepaCountries.has(billingAddress.CountryCode)
        : false;

    return (
        flowSupportsSepaDirectDebit(context) &&
        billingCountrySupportsSEPA &&
        !isBF2025Offer(context) &&
        // separate flag for B2C plans
        (isB2BPlan(context) || !!enableSepaB2C) &&
        !isTrial
    );
};

const isCashAvailable = (context: PaymentMethodsContext) => {
    const { paymentStatus, flow, coupon, isTrial } = context;

    return paymentStatus.VendorStates.Cash && !isSignupFlow(flow) && !isBF2025Offer(context) && !coupon && !isTrial;
};

const isApplePayAvailable = ({
    paymentStatus,
    amount,
    currency,
    flow,
    canUseApplePay,
    isTrial,
}: PaymentMethodsContext) =>
    paymentStatus.VendorStates.Apple &&
    amount >= getMinApplePayAmount(currency) &&
    applePayEnabledFlows.includes(flow) &&
    !!canUseApplePay &&
    !isTrial;

const isGooglePayAvailable = ({
    paymentStatus,
    amount,
    currency,
    flow,
    canUseGooglePay,
    isTrial,
}: PaymentMethodsContext) =>
    paymentStatus.VendorStates.Google &&
    amount >= getMinGooglePayAmount(currency) &&
    googlePayEnabledFlows.includes(flow) &&
    !!canUseGooglePay &&
    !isTrial;

const isChargebeeIdealAvailable = ({
    paymentStatus,
    paymentMethods,
    billingAddress,
    isTrial,
    enableIdeal,
}: PaymentMethodsContext) => {
    const alreadyHasIdeal = paymentMethods.some(({ Type }) => Type === PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL);

    const billingCountryIsNetherlands = billingAddress?.CountryCode === 'NL';

    return (
        paymentStatus.VendorStates.Ideal && billingCountryIsNetherlands && !alreadyHasIdeal && !isTrial && !!enableIdeal
    );
};

/**
 * New (i.e. non-saved) payment methods, in display order. Each one is individually checked for availability, which is
 * controlled by the payment status, the selected flow and the amount.
 */
const availabilityByMethodType: [PAYMENT_METHOD_TYPES, (context: PaymentMethodsContext) => boolean][] = [
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, isChargebeeCardAvailable],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, isChargebeePaypalAvailable],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, isChargebeeBitcoinAvailable],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, isSepaDirectDebitAvailable],
    [PAYMENT_METHOD_TYPES.CASH, isCashAvailable],
    [PAYMENT_METHOD_TYPES.APPLE_PAY, isApplePayAvailable],
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY, isGooglePayAvailable],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, isChargebeeIdealAvailable],
];

export const getNewMethods = (context: PaymentMethodsContext): AvailablePaymentMethod[] =>
    availabilityByMethodType
        .filter(([, isAvailable]) => isAvailable(context))
        .map(([type]) => ({ type, value: type, isSaved: false, isDefault: false }));

export const isMethodTypeEnabled = (context: PaymentMethodsContext, methodType: PlainPaymentMethodType): boolean =>
    !!availabilityByMethodType.find(([type]) => type === methodType)?.[1](context);

/**
 * Formats the list of saved payment methods. It can be then used to render the list of payment methods.
 * Depending on your application, you might need to enrich the list with additional UI-specific information, e.g.
 * name of the payment method, or icon, etc.
 *
 * Only saveable vendors are kept: it's not possible to make Bitcoin/Cash a saved payment method.
 */
export const getUsedMethods = (context: PaymentMethodsContext): AvailablePaymentMethod[] => {
    const { paymentMethods, paymentStatus } = context;

    const isSavedMethodUsable = ({ Type }: SavedPaymentMethod) => {
        switch (Type) {
            case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
                return paymentStatus.VendorStates.Card;
            case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
                return paymentStatus.VendorStates.Paypal;
            case PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT:
                return paymentStatus.VendorStates.Card && flowSupportsSepaDirectDebit(context);
            case PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL:
                return paymentStatus.VendorStates.Ideal;
            case PAYMENT_METHOD_TYPES.APPLE_PAY:
                return paymentStatus.VendorStates.Apple;
            case PAYMENT_METHOD_TYPES.GOOGLE_PAY:
                return paymentStatus.VendorStates.Google;
            default:
                return false;
        }
    };

    return paymentMethods.filter(isSavedMethodUsable).map((paymentMethod) => ({
        type: paymentMethod.Type,
        paymentMethodId: paymentMethod.ID,
        value: paymentMethod.ID,
        isSaved: true,
        isExpired: paymentMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && isCardExpired(paymentMethod.Details),
        isDefault: !!paymentMethod.IsDefault,
    }));
};
