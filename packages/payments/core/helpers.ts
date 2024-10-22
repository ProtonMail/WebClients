import { DEFAULT_CURRENCY, type FreeSubscription } from '@proton/shared/lib/constants';
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
import { type ADDON_NAMES, type PLANS, signupFlows } from './constants';
import type {
    Invoice,
    PaymentMethodFlows,
    PaymentMethodStatus,
    PaymentMethodStatusExtended,
    PlainPaymentMethodType,
} from './interface';
import { isPaymentMethodStatusExtended, isStringPLAN } from './type-guards';

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
        return 'EUR';
    }

    return currency;
}

export function getSupportedRegionalCurrencies({
    status,
    plans,
    selectedPlanName,
    user,
    subscription,
}: {
    status?: PaymentMethodStatusExtended;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    user?: User;
    subscription?: Subscription | FreeSubscription;
}): Currency[] {
    if (user?.ChargebeeUser === ChargebeeEnabled.INHOUSE_FORCED) {
        return [];
    }

    const statusCurrency = !!status ? mapCountryToRegionalCurrency(status.CountryCode) : undefined;

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

export type GetPreferredCurrencyParams = Parameters<typeof getPreferredCurrency>[0];
export function getPreferredCurrency({
    status,
    plans,
    paramCurrency,
    paramPlanName,
    user,
    subscription,
    selectedPlan,
}: {
    status?: PaymentMethodStatusExtended;
    plans?: Plan[];
    selectedPlan?: Plan;
    paramCurrency?: Currency;
    paramPlanName?: string;
    user?: UserModel;
    subscription?: Subscription | FreeSubscription;
}): Currency {
    const statusCurrency =
        status && user?.ChargebeeUser !== ChargebeeEnabled.INHOUSE_FORCED
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

    const ifPlanSupportsCurrency = (preferredCurrency: Currency): Currency => {
        const paramPlanSupportsCurrency: boolean =
            !paramPlanName ||
            !isStringPLAN(paramPlanName) ||
            !!plans?.find((it) => it.Name === paramPlanName && it.Currency === preferredCurrency);

        const currency = paramPlanSupportsCurrency ? preferredCurrency : getFallbackCurrency(preferredCurrency);

        const selectedPlanSupportsCurrency: boolean = !selectedPlan || selectedPlan.Currency === currency;
        const plansSupportCurrency: boolean = !plans || !!plans.find((it) => it.Currency === currency);

        return selectedPlanSupportsCurrency && plansSupportCurrency ? currency : fallbackResult;
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
    paramCurrency,
}: {
    status?: PaymentMethodStatusExtended;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
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
    });

    return [...mainCurrencies, ...regionalCurrencies];
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

export function isSignupFlow(flow: PaymentMethodFlows): boolean {
    return signupFlows.includes(flow);
}

const CREDIT_NOTE_PREFIX = 'CN';
export function isCreditNoteInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return invoice.ID.startsWith(CREDIT_NOTE_PREFIX);
}

const CURRENCY_CONVERSION_PREFIX = 'CC';
export function isCurrencyConversionInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return invoice.ID.startsWith(CURRENCY_CONVERSION_PREFIX);
}

export function isRegularInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return !isCreditNoteInvoice(invoice) && !isCurrencyConversionInvoice(invoice);
}

/**
 * That's a naïve currency conversion. Can't be used in any critical applications. But can be used for cases that are
 * updated rare. For example, the buttons that pre-select the number of credit to top up.
 */
export function getCurrencyRate(currency: Currency): number {
    if (currency === 'BRL') {
        return 5;
    }

    return 1;
}
