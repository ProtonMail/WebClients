import {
    type ADDON_NAMES,
    DEFAULT_CURRENCY,
    type FreeSubscription,
    type PLANS,
    isStringPLAN,
} from '@proton/shared/lib/constants';
import {
    ChargebeeEnabled,
    type Currency,
    type Plan,
    type Subscription,
    type User,
    type UserModel,
} from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DEFAULT_TAX_BILLING_ADDRESS } from './billing-address';
import { MethodStorage, PAYMENT_METHOD_TYPES, signupFlows } from './constants';
import type {
    CardPayment,
    CheckWithAutomaticOptions,
    ExistingPaymentMethod,
    ExtendedTokenPayment,
    PayPalDetails,
    PaymentMethodFlows,
    PaymentMethodStatus,
    PaymentMethodStatusExtended,
    PaymentMethodType,
    PaypalPayment,
    PlainPaymentMethodType,
    SavedCardDetails,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
    TokenPayment,
    TokenPaymentMethod,
    V5PaymentToken,
    V5Payments,
    WrappedPaymentsVersion,
    WrappedProcessorType,
} from './interface';

export function isChargebeePaymentMethod(paymentMethodType: PlainPaymentMethodType | undefined) {
    if (!paymentMethodType) {
        return false;
    }

    switch (paymentMethodType) {
        case 'card':
        case 'paypal':
        case 'paypal-credit':
        case 'bitcoin':
        case 'cash':
        case 'token':
            return false;

        case 'chargebee-bitcoin':
        case 'chargebee-card':
        case 'chargebee-paypal':
            return true;
    }
}

export const mainCurrencies: readonly Currency[] = Object.freeze(['USD', 'EUR', 'CHF']);
export function isMainCurrency(currency: Currency): boolean {
    return mainCurrencies.includes(currency);
}

export function isRegionalCurrency(currency: Currency): boolean {
    return !isMainCurrency(currency);
}

export function mapCountryToRegionalCurrency(countryCode: string): Currency | undefined {
    switch (countryCode) {
        case 'BR':
            return 'BRL';
        // placeholder for testing
        case 'AR':
            return 'ARS' as any; // todo: remove as any when/if ARS is supported
    }
}

export function getFallbackCurrency(currency: Currency): Currency {
    if (isRegionalCurrency(currency)) {
        return 'USD';
    }

    return currency;
}

export function getSupportedRegionalCurrencies({
    status,
    plans,
    selectedPlanName,
    user,
    subscription,
    regionalCurrenciesEnabled,
}: {
    status?: PaymentMethodStatusExtended;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    regionalCurrenciesEnabled: boolean;
}): Currency[] {
    if (user?.ChargebeeUser === ChargebeeEnabled.INHOUSE_FORCED) {
        return [];
    }

    const statusCurrency =
        !!status && !!regionalCurrenciesEnabled ? mapCountryToRegionalCurrency(status.CountryCode) : undefined;

    const currencies = [statusCurrency, subscription?.Currency, user?.Currency]
        .filter(isTruthy)
        .filter(isRegionalCurrency)
        // if plans are provided, only include regional currencies that are supported by at least one plan
        .filter((currency) => !plans || plans.some((plan) => plan.Currency === currency))
        // if selected plan is provided, only include regional currencies that are supported by the selected plan
        .filter(
            (currency) =>
                !selectedPlanName ||
                !!plans?.find((plan) => plan.Name === selectedPlanName && plan.Currency === currency)
        );

    return Array.from(new Set(currencies));
}

export function getPreferredCurrency({
    status,
    plans,
    paramCurrency,
    paramPlanName,
    user,
    subscription,
    regionalCurrenciesEnabled,
    selectedPlan,
}: {
    status?: PaymentMethodStatusExtended;
    plans?: Plan[];
    selectedPlan?: Plan;
    paramCurrency?: Currency;
    paramPlanName?: string;
    user?: UserModel;
    subscription?: Subscription | FreeSubscription;
    regionalCurrenciesEnabled: boolean;
}): Currency {
    const statusCurrency =
        status && regionalCurrenciesEnabled && user?.ChargebeeUser !== ChargebeeEnabled.INHOUSE_FORCED
            ? mapCountryToRegionalCurrency(status.CountryCode)
            : undefined;

    const userCurrency =
        !!user && (isRegionalCurrency(user?.Currency) || !!user?.isPaid || user?.Credit !== 0)
            ? user.Currency
            : undefined;

    const usedCurrencies = [userCurrency, subscription?.Currency, statusCurrency].filter(isTruthy);

    const fallbackResult = (() => {
        const planCurrency = plans?.[0]?.Currency;
        if (!planCurrency) {
            return DEFAULT_CURRENCY;
        }

        // we can't fallback to regional currency if they are not enabled and if user doesn't have history with
        // regional currencies
        const canFallbackToRegional = usedCurrencies.some(isRegionalCurrency);
        if (canFallbackToRegional) {
            return planCurrency;
        }

        // if we can't user regional currency as a fallback, we fallback to a main currency
        const plansCurrencies = plans?.map((it) => it.Currency);

        return plansCurrencies.find((it) => isMainCurrency(it)) ?? DEFAULT_CURRENCY;
    })();

    const ifPlanSupportsCurrency = (currency: Currency) => {
        const selectedPlanSupportsCurrency = !selectedPlan || selectedPlan.Currency === currency;
        const plansSupportCurrency = !plans || plans.find((it) => it.Currency === currency);
        const paramPlanSupportsCurrency =
            !paramPlanName ||
            !isStringPLAN(paramPlanName) ||
            plans?.find((it) => it.Name === paramPlanName && it.Currency === currency);

        return selectedPlanSupportsCurrency && plansSupportCurrency && paramPlanSupportsCurrency
            ? currency
            : fallbackResult;
    };

    if (paramCurrency) {
        if (!isRegionalCurrency(paramCurrency) || usedCurrencies.includes(paramCurrency)) {
            return ifPlanSupportsCurrency(paramCurrency);
        }

        return ifPlanSupportsCurrency(getFallbackCurrency(paramCurrency));
    }

    if (usedCurrencies?.length > 0) {
        return ifPlanSupportsCurrency(usedCurrencies[0]);
    }

    return fallbackResult;
}

export function getAvailableCurrencies({
    status,
    user,
    subscription,
    plans,
    selectedPlanName,
    regionalCurrenciesEnabled,
    paramCurrency,
}: {
    status?: PaymentMethodStatusExtended;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    regionalCurrenciesEnabled: boolean;
    paramCurrency?: Currency;
}): readonly Currency[] {
    if (paramCurrency && isMainCurrency(paramCurrency)) {
        return mainCurrencies;
    }

    const regionalCurrencies = getSupportedRegionalCurrencies({
        status,
        plans,
        selectedPlanName,
        user,
        subscription,
        regionalCurrenciesEnabled,
    });

    return [...mainCurrencies, ...regionalCurrencies];
}
export function isCardPayment(payment: any): payment is CardPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.CARD && !!payment?.Details;
}
export function isTokenPayment(payment: any): payment is TokenPayment {
    return payment?.Type === PAYMENT_METHOD_TYPES.TOKEN || !!(payment as any)?.Details?.Token;
}
export function isWrappedPaymentsVersion(data: any): data is WrappedPaymentsVersion {
    return !!data && !!data.paymentsVersion;
}
export function isWrappedProcessorType(data: any): data is WrappedProcessorType {
    return !!data && !!data.paymentProcessorType;
}
export function isExtendedTokenPayment(data: any): data is ExtendedTokenPayment {
    return isWrappedProcessorType(data) && isWrappedPaymentsVersion(data);
}
export function isPaypalPayment(payment: any): payment is PaypalPayment {
    return (
        payment && (payment.Type === PAYMENT_METHOD_TYPES.PAYPAL || payment.Type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT)
    );
}
export function isTokenPaymentMethod(data: any): data is TokenPaymentMethod {
    return !!data && isTokenPayment(data.Payment);
}
export function isPaymentMethodStatusExtended(obj: any): obj is PaymentMethodStatusExtended {
    if (!obj) {
        return false;
    }

    return !!obj.VendorStates;
}
export function extendStatus(status: PaymentMethodStatus | PaymentMethodStatusExtended): PaymentMethodStatusExtended {
    if (!isPaymentMethodStatusExtended(status)) {
        return {
            VendorStates: status,
            CountryCode: DEFAULT_TAX_BILLING_ADDRESS.CountryCode,
        };
    }

    return status;
}
export function isPaypalDetails(obj: any): obj is PayPalDetails {
    if (!obj) {
        return false;
    }

    const props: (keyof PayPalDetails)[] = ['BillingAgreementID', 'PayerID'];

    return props.every((prop) => typeof obj[prop] === 'string');
}
export function isSavedCardDetails(obj: any): obj is SavedCardDetails {
    if (!obj) {
        return false;
    }

    // Name is optional property, so we don't need to check it here
    const props: (keyof SavedCardDetails)[] = ['ExpMonth', 'ExpYear', 'Country', 'Last4', 'Brand'];

    return props.every((prop) => typeof obj[prop] === 'string');
}
export function isSavedPaymentMethodInternal(
    paymentMethod?: SavedPaymentMethod
): paymentMethod is SavedPaymentMethodInternal {
    return (
        paymentMethod?.External === MethodStorage.INTERNAL || (!!paymentMethod && paymentMethod.External === undefined)
    );
}
export function isSavedPaymentMethodExternal(
    paymentMethod?: SavedPaymentMethod
): paymentMethod is SavedPaymentMethodExternal {
    return paymentMethod?.External === MethodStorage.EXTERNAL;
}
export function methodMatches(
    method: PaymentMethodType | undefined,
    methods: PlainPaymentMethodType[]
): method is PlainPaymentMethodType {
    if (!method) {
        return false;
    }

    return (methods as string[]).includes(method);
}
export function isExistingPaymentMethod(paymentMethod?: PaymentMethodType): paymentMethod is ExistingPaymentMethod {
    return (
        paymentMethod !== undefined &&
        typeof paymentMethod === 'string' &&
        !methodMatches(paymentMethod, Object.values(PAYMENT_METHOD_TYPES))
    );
}
export function isSignupFlow(flow: PaymentMethodFlows): boolean {
    return signupFlows.includes(flow);
}
export function isV5Payments(data: any): data is V5Payments {
    return !!data && data.v === 5;
}
export function isV5PaymentToken(data: any): data is V5PaymentToken {
    return data.PaymentToken && isV5Payments(data);
}
export function isCheckWithAutomaticOptions(data: any): data is CheckWithAutomaticOptions {
    return !!data && !!data.forcedVersion && !!data.reason;
}
