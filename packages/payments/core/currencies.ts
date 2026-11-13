import type { User, UserModel } from '@proton/shared/lib/interfaces/User';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import type { FeatureFlag } from '@proton/unleash/Flags';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';
import isTruthy from '@proton/utils/isTruthy';

import type { BillingAddress } from './billing-address/billing-address';
import { type ADDON_NAMES, PLANS } from './constants';
import type { Currency, PaymentStatus } from './interface';
import { getWebSubscriptions } from './subscription/helpers/external-management';
import type { Subscription } from './subscription/interface';
import type { MultiSubscriptionContext } from './subscription/multi-subscription-context';
import { getPurchaseOutcome } from './subscription/purchase-outcome';
import { isValidPlanName } from './type-guards';

interface CurrencyFormattingConfig {
    symbolPosition: 'suffix-space' | 'prefix-space' | 'prefix-nospace';
    decimalPoints: number;
    divisor: number;
}

export function getCurrencyFormattingConfigWithoutFallback(currency: Currency): CurrencyFormattingConfig | undefined {
    type CurrencyFormattingConfigWithoutDelimiter = Omit<CurrencyFormattingConfig, 'divisor'>;

    const currencyFormattingConfigs: Record<Currency, CurrencyFormattingConfigWithoutDelimiter> = {
        EUR: { symbolPosition: 'suffix-space', decimalPoints: 2 },
        CHF: { symbolPosition: 'prefix-space', decimalPoints: 2 },
        USD: { symbolPosition: 'prefix-nospace', decimalPoints: 2 },
        BRL: { symbolPosition: 'prefix-space', decimalPoints: 2 },
        GBP: { symbolPosition: 'prefix-nospace', decimalPoints: 2 },
        CAD: { symbolPosition: 'prefix-nospace', decimalPoints: 2 },
        AUD: { symbolPosition: 'prefix-nospace', decimalPoints: 2 },
        SGD: { symbolPosition: 'prefix-space', decimalPoints: 2 },
        HKD: { symbolPosition: 'prefix-nospace', decimalPoints: 2 },
        JPY: { symbolPosition: 'prefix-nospace', decimalPoints: 0 },
        KRW: { symbolPosition: 'prefix-nospace', decimalPoints: 0 },
        PLN: { symbolPosition: 'suffix-space', decimalPoints: 2 },
    };

    const configsWithDelimiter = Object.fromEntries(
        (Object.entries(currencyFormattingConfigs) as [Currency, CurrencyFormattingConfigWithoutDelimiter][]).map(
            ([currency, config]) => [currency, { ...config, divisor: 10 ** config.decimalPoints }]
        )
    ) as Record<Currency, CurrencyFormattingConfig>;

    return configsWithDelimiter?.[currency];
}

export function getCurrencyFormattingConfig(currency: Currency): CurrencyFormattingConfig {
    return getCurrencyFormattingConfigWithoutFallback(currency) ?? getCurrencyFormattingConfigWithoutFallback('USD')!;
}

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

    // Requested as part of P2-1793 - Greenland and Iceland promotion. It is a permanent addition to the list.
    'GL',
]);

export function getDefaultMainCurrencyByCountryCode(countryCode: string | undefined): Currency {
    const fallbackCurrency: Currency = 'USD';
    if (countryCode) {
        if (countryCode === 'CH') {
            return 'CHF';
        }

        if (countriesWithEurFallback.has(countryCode)) {
            return 'EUR';
        }
    }

    return fallbackCurrency;
}

/**
 * A function that generalizes the old DEFAULT_CURRENCY constant. Instead of always using EUR, we gravitate towards USD
 * as defined by P2-1039, while some countries have their own fallbacks among main currencies. For example, most of the
 * EU countries fall back to EUR, and Switzerland falls back to CHF.
 */
export function getDefaultMainCurrency(paymentStatus?: PaymentStatus | BillingAddress): Currency {
    return getDefaultMainCurrencyByCountryCode(paymentStatus?.CountryCode);
}

export const mainCurrencies: readonly Currency[] = Object.freeze(['USD', 'EUR', 'CHF']);
export function isMainCurrency(currency: Currency): boolean {
    return mainCurrencies.includes(currency);
}

export function isRegionalCurrency(currency: Currency): boolean {
    return !isMainCurrency(currency);
}

const NEW_BATCH_CURRENCIES_FEATURE_FLAG: FeatureFlag | undefined = undefined;

function getIsNewBatchCurrenciesEnabled(): boolean {
    if (!NEW_BATCH_CURRENCIES_FEATURE_FLAG) {
        return true;
    }

    return getStandaloneUnleashClient()?.isEnabled(NEW_BATCH_CURRENCIES_FEATURE_FLAG) ?? true;
}

function isNewBatchRegionalCurrency(currency: Currency | undefined): boolean {
    if (!currency) {
        return false;
    }

    const newBatchRegionalCurrencies: readonly Currency[] = [];
    return newBatchRegionalCurrencies.includes(currency);
}

const countryToRegionalCurrencyMap: Readonly<Partial<Record<string, Currency>>> = Object.freeze({
    BR: 'BRL',
    GB: 'GBP',
    AU: 'AUD',
    CA: 'CAD',
    JP: 'JPY',
    KR: 'KRW',
    PL: 'PLN',
    SG: 'SGD',
    HK: 'HKD',
});

export function mapCountryToRegionalCurrency(countryCode: string): Currency | undefined {
    return countryToRegionalCurrencyMap[countryCode];
}

export function mapRegionalCurrencyToCountry(currency: Currency): string | undefined {
    return Object.entries(countryToRegionalCurrencyMap).find(([_, value]) => value === currency)?.[0];
}

export function getFallbackCurrency(currency: Currency): Currency {
    const country = mapRegionalCurrencyToCountry(currency);
    return getDefaultMainCurrencyByCountryCode(country);
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
        plansCurrency === mapCountryToRegionalCurrency(paymentStatus?.CountryCode)
            ? plansCurrency
            : null;

    return maybeRegionalPlansCurrency;
}

export function getStatusCurrency(
    paymentStatus: PaymentStatus | undefined,
    user: User | undefined
): Currency | undefined {
    const statusCurrency = paymentStatus ? mapCountryToRegionalCurrency(paymentStatus.CountryCode) : undefined;
    const newBatchCurrency = isNewBatchRegionalCurrency(statusCurrency);

    return !user || !newBatchCurrency || getIsNewBatchCurrenciesEnabled() ? statusCurrency : undefined;
}

export function getSupportedRegionalCurrencies({
    paymentStatus,
    plans,
    selectedPlanName,
    user,
    subscriptions,
}: {
    paymentStatus?: PaymentStatus;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    user?: User;
    subscriptions: Subscription[];
}): Currency[] {
    const statusCurrency = getStatusCurrency(paymentStatus, user);

    const currencies = [
        statusCurrency,
        ...subscriptions.map((subscription) => subscription.Currency),
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

/**
 * With two web subscriptions the lock applies to any selected plan, including plans that can't run next to them, such as
 * business plans opened with ?plan=mailpro2022. Those are sold in USD, EUR and CHF only, so locking to a regional
 * currency would price the checkout in a currency the plan has no price in. The lock is skipped for a plan without a
 * price in the locked currency, and subscription/check refuses the purchase. Every plan that can run next to another
 * subscription is sold in the same currencies today. If one ever isn't, refuse that purchase instead of picking another
 * currency: all subscriptions must share one currency.
 */
const getLockedCurrency = (
    multiSubscriptionContext: MultiSubscriptionContext,
    selectedPlanName: string | undefined,
    plans: Plan[] | undefined
): Currency | undefined => {
    const webSubscriptions = getWebSubscriptions(multiSubscriptionContext.subscriptions);
    const [anyWebSubscription] = webSubscriptions;
    if (!multiSubscriptionContext.lumoMultiSubscriptions || !anyWebSubscription) {
        return undefined;
    }

    const lockedCurrency = anyWebSubscription.Currency;
    const selectedPlanCurrencies =
        plans?.filter((plan) => plan.Name === selectedPlanName).map((plan) => plan.Currency) ?? [];
    if (selectedPlanCurrencies.length > 0 && !selectedPlanCurrencies.includes(lockedCurrency)) {
        return undefined;
    }

    if (webSubscriptions.length >= 2) {
        return lockedCurrency;
    }

    if (!selectedPlanName || !isValidPlanName(selectedPlanName)) {
        return undefined;
    }

    const createsSubscriptionNextToIt =
        getPurchaseOutcome(multiSubscriptionContext, { [selectedPlanName]: 1 }).type === 'new-subscription';

    return createsSubscriptionNextToIt ? lockedCurrency : undefined;
};

export function getPreferredCurrency({
    paymentStatus,
    plans,
    paramCurrency,
    paramPlanName,
    user,
    multiSubscriptionContext,
    selectedPlan,
}: {
    paymentStatus?: PaymentStatus;
    plans?: Plan[];
    selectedPlan?: Plan;
    paramCurrency?: Currency;
    paramPlanName?: string;
    user?: UserModel;
    multiSubscriptionContext: MultiSubscriptionContext;
}): Currency {
    const lockedCurrency = getLockedCurrency(multiSubscriptionContext, selectedPlan?.Name ?? paramPlanName, plans);
    if (lockedCurrency) {
        return lockedCurrency;
    }

    const statusCurrency = getStatusCurrency(paymentStatus, user);

    const userCurrency =
        !!user && (isRegionalCurrency(user?.Currency) || !!user?.isPaid || user?.Credit !== 0)
            ? user.Currency
            : undefined;

    const usedCurrencies = [
        userCurrency,
        ...multiSubscriptionContext.subscriptions.map((subscription) => subscription.Currency),
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
    multiSubscriptionContext,
    plans,
    selectedPlanName,
    paramCurrency,
}: {
    paymentStatus?: PaymentStatus;
    user?: User;
    multiSubscriptionContext: MultiSubscriptionContext;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    paramCurrency?: Currency;
}): readonly Currency[] {
    const lockedCurrency = getLockedCurrency(multiSubscriptionContext, selectedPlanName, plans);
    if (lockedCurrency) {
        return [lockedCurrency];
    }

    if (paramCurrency && isMainCurrency(paramCurrency)) {
        return mainCurrencies;
    }

    const regionalCurrencies = getSupportedRegionalCurrencies({
        paymentStatus,
        plans,
        selectedPlanName,
        user,
        subscriptions: multiSubscriptionContext.subscriptions,
    });

    return [...mainCurrencies, ...regionalCurrencies];
}

/**
 * That's a naïve currency conversion. Must not be used in any critical applications. But can be used for cases that are
 * updated rare. For example, the buttons that pre-select the number of credit to top up.
 */
export function getNaiveCurrencyRate(currency: Currency): number {
    const currencyRates: Partial<Record<Currency, number>> = {
        BRL: 5,
        PLN: 5,
        HKD: 10,
        JPY: 100,
        KRW: 1000,
    };

    const defaultDecimalPoints = getCurrencyFormattingConfig('USD').decimalPoints;

    const decimalPointsDiff = defaultDecimalPoints - getCurrencyFormattingConfig(currency).decimalPoints;
    const decimalShift = 10 ** decimalPointsDiff;

    return (currencyRates[currency] ?? 1) / decimalShift;
}
