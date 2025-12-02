import type { User, UserModel } from '@proton/shared/lib/interfaces';
import type { FeatureFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import type { BillingAddress } from './billing-address/billing-address';
import { type ADDON_NAMES, PLANS } from './constants';
import type { Currency, FreeSubscription, PaymentStatus } from './interface';
import type { Plan } from './plan/interface';
import type { Subscription } from './subscription/interface';
import { isValidPlanName } from './type-guards';

const countriesWithEurFallback = new Set([
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
    // 'HU', must be USD
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    // 'PL', must be USD
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
    // 'CH', must have CHF
    'GB', // has GBP currency but we still use EUR as fallback in case if the regional currency isn't available for some plans
    'AD',
    'MC',
    'SM',
    'VA',
]);

/**
 * A function that generalizes the old DEFAULT_CURRENCY constant. Instead of always using EUR, we gravitate towards USD
 * as defined by P2-1039, while some countries have their own fallbacks among main currencies. For example, most of the
 * EU countries fall back to EUR, and Switzerland falls back to CHF.
 */
export const getDefaultMainCurrency = (paymentStatus?: PaymentStatus | BillingAddress): Currency => {
    const fallbackCurrency: Currency = 'USD';
    const countryCode = paymentStatus?.CountryCode;
    if (!countryCode) {
        return fallbackCurrency;
    }

    if (countryCode === 'CH') {
        return 'CHF';
    }

    if (countriesWithEurFallback.has(countryCode)) {
        return 'EUR';
    }

    // it is expected that the regional currency can't be the default currency, so we fallback to the main currency.
    // This is because regional currencies are not supported by all plans.
    return fallbackCurrency;
};

export const mainCurrencies: readonly Currency[] = Object.freeze(['USD', 'EUR', 'CHF']);
export function isMainCurrency(currency: Currency): boolean {
    return mainCurrencies.includes(currency);
}

export function isRegionalCurrency(currency: Currency): boolean {
    return !isMainCurrency(currency);
}

export const NEW_BATCH_CURRENCIES_FEATURE_FLAG: FeatureFlag | undefined = undefined;
const newBatchCurrencies = new Set<Currency>([]);

export function mapCountryToRegionalCurrency(
    countryCode: string,
    enableNewBatchCurrencies: boolean
): Currency | undefined {
    const result = {
        BR: 'BRL' as const,
        GB: 'GBP' as const,
        AU: 'AUD' as const,
        CA: 'CAD' as const,
    }[countryCode];

    if (!result) {
        return;
    }

    const isNewBatchCurrency = newBatchCurrencies.has(result);
    if (!isNewBatchCurrency) {
        return result;
    }

    return enableNewBatchCurrencies ? result : undefined;
}

export function getFallbackCurrency(currency: Currency): Currency {
    if (isRegionalCurrency(currency)) {
        return 'EUR';
    }

    return currency;
}

function getMaybeRegionalPlansCurrency(
    plans: Plan[] | undefined,
    paymentStatus: PaymentStatus | undefined
): Currency | null {
    const plansCurrency = plans?.[0]?.Currency;
    const maybeRegionalPlansCurrency =
        !!plansCurrency &&
        isRegionalCurrency(plansCurrency) &&
        !!paymentStatus &&
        plansCurrency === mapCountryToRegionalCurrency(paymentStatus?.CountryCode, true)
            ? plansCurrency
            : null;

    return maybeRegionalPlansCurrency;
}

export function getSupportedRegionalCurrencies({
    paymentStatus,
    plans,
    selectedPlanName,
    user,
    subscription,
    enableNewBatchCurrencies,
}: {
    paymentStatus?: PaymentStatus;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    enableNewBatchCurrencies: boolean;
}): Currency[] {
    const statusCurrency = !!paymentStatus
        ? mapCountryToRegionalCurrency(paymentStatus.CountryCode, enableNewBatchCurrencies)
        : undefined;

    const currencies = [
        statusCurrency,
        subscription?.Currency,
        user?.Currency,
        getMaybeRegionalPlansCurrency(plans, paymentStatus),
    ]
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
    paymentStatus,
    plans,
    paramCurrency,
    paramPlanName,
    user,
    subscription,
    selectedPlan,
    enableNewBatchCurrencies,
}: {
    paymentStatus?: PaymentStatus;
    plans?: Plan[];
    selectedPlan?: Plan;
    paramCurrency?: Currency;
    paramPlanName?: string;
    user?: UserModel;
    subscription?: Subscription | FreeSubscription | null;
    enableNewBatchCurrencies: boolean;
}): Currency {
    const statusCurrency = paymentStatus
        ? mapCountryToRegionalCurrency(paymentStatus.CountryCode, enableNewBatchCurrencies)
        : undefined;

    const userCurrency =
        !!user && (isRegionalCurrency(user?.Currency) || !!user?.isPaid || user?.Credit !== 0)
            ? user.Currency
            : undefined;

    const usedCurrencies = [
        userCurrency,
        subscription?.Currency,
        statusCurrency,
        getMaybeRegionalPlansCurrency(plans, paymentStatus),
    ].filter(isTruthy);

    const fallbackResult = (() => {
        const planCurrency = plans?.[0]?.Currency;
        if (!planCurrency) {
            return user?.Currency ?? getDefaultMainCurrency(paymentStatus);
        }

        // we can't fallback to regional currency if they are not enabled and if user doesn't have history with
        // regional currencies
        const canFallbackToRegional = usedCurrencies.some(isRegionalCurrency);
        if (canFallbackToRegional) {
            return planCurrency;
        }

        // if we can't user regional currency as a fallback, we fallback to a main currency
        const plansCurrencies = plans?.map((it) => it.Currency);

        return plansCurrencies.find((it) => isMainCurrency(it)) ?? getDefaultMainCurrency(paymentStatus);
    })();

    const ifPlanSupportsCurrency = (preferredCurrency: Currency): Currency => {
        const paramPlanSupportsCurrency: boolean =
            !paramPlanName ||
            paramPlanName === PLANS.FREE ||
            !isValidPlanName(paramPlanName) ||
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
    paymentStatus,
    user,
    subscription,
    plans,
    selectedPlanName,
    paramCurrency,
    enableNewBatchCurrencies,
}: {
    paymentStatus?: PaymentStatus;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    paramCurrency?: Currency;
    enableNewBatchCurrencies: boolean;
}): readonly Currency[] {
    if (paramCurrency && isMainCurrency(paramCurrency)) {
        return mainCurrencies;
    }

    const regionalCurrencies = getSupportedRegionalCurrencies({
        paymentStatus,
        plans,
        selectedPlanName,
        user,
        subscription,
        enableNewBatchCurrencies,
    });

    return [...mainCurrencies, ...regionalCurrencies];
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
