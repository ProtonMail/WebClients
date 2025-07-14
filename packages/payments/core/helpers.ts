import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { ChargebeeEnabled, type User, type UserModel } from '@proton/shared/lib/interfaces';
import { type FeatureFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { DEFAULT_TAX_BILLING_ADDRESS } from './billing-address';
import { type ADDON_NAMES, DEFAULT_CURRENCY, PLANS, signupFlows } from './constants';
import type {
    Currency,
    Invoice,
    PaymentMethodFlow,
    PaymentMethodStatus,
    PaymentMethodStatusExtended,
    PlainPaymentMethodType,
    PlanIDs,
} from './interface';
import { type FreeSubscription } from './interface';
import { getPlanNameFromIDs } from './plan/helpers';
import { type Plan } from './plan/interface';
import { type Subscription } from './subscription/interface';
import { isPaymentMethodStatusExtended, isValidPlanName } from './type-guards';

export function isChargebeePaymentMethod(paymentMethodType: PlainPaymentMethodType | undefined) {
    if (!paymentMethodType) {
        return false;
    }

    switch (paymentMethodType) {
        case 'card':
        case 'paypal':
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
    status: PaymentMethodStatusExtended | undefined
): Currency | null {
    const plansCurrency = plans?.[0]?.Currency;
    const maybeRegionalPlansCurrency =
        !!plansCurrency &&
        isRegionalCurrency(plansCurrency) &&
        !!status &&
        plansCurrency === mapCountryToRegionalCurrency(status?.CountryCode, true)
            ? plansCurrency
            : null;

    return maybeRegionalPlansCurrency;
}

export function getSupportedRegionalCurrencies({
    status,
    plans,
    selectedPlanName,
    user,
    subscription,
    enableNewBatchCurrencies,
}: {
    status?: PaymentMethodStatusExtended;
    plans?: Plan[];
    selectedPlanName?: PLANS | ADDON_NAMES;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    enableNewBatchCurrencies: boolean;
}): Currency[] {
    if (user?.ChargebeeUser === ChargebeeEnabled.INHOUSE_FORCED) {
        return [];
    }

    const statusCurrency = !!status
        ? mapCountryToRegionalCurrency(status.CountryCode, enableNewBatchCurrencies)
        : undefined;

    const currencies = [
        statusCurrency,
        subscription?.Currency,
        user?.Currency,
        getMaybeRegionalPlansCurrency(plans, status),
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
    status,
    plans,
    paramCurrency,
    paramPlanName,
    user,
    subscription,
    selectedPlan,
    enableNewBatchCurrencies,
}: {
    status?: PaymentMethodStatusExtended;
    plans?: Plan[];
    selectedPlan?: Plan;
    paramCurrency?: Currency;
    paramPlanName?: string;
    user?: UserModel;
    subscription?: Subscription | FreeSubscription;
    enableNewBatchCurrencies: boolean;
}): Currency {
    const statusCurrency =
        status && user?.ChargebeeUser !== ChargebeeEnabled.INHOUSE_FORCED
            ? mapCountryToRegionalCurrency(status.CountryCode, enableNewBatchCurrencies)
            : undefined;

    const userCurrency =
        !!user && (isRegionalCurrency(user?.Currency) || !!user?.isPaid || user?.Credit !== 0)
            ? user.Currency
            : undefined;

    const usedCurrencies = [
        userCurrency,
        subscription?.Currency,
        statusCurrency,
        getMaybeRegionalPlansCurrency(plans, status),
    ].filter(isTruthy);

    const fallbackResult = (() => {
        const planCurrency = plans?.[0]?.Currency;
        if (!planCurrency) {
            return user?.Currency ?? DEFAULT_CURRENCY;
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
    status,
    user,
    subscription,
    plans,
    selectedPlanName,
    paramCurrency,
    enableNewBatchCurrencies,
}: {
    status?: PaymentMethodStatusExtended;
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
        status,
        plans,
        selectedPlanName,
        user,
        subscription,
        enableNewBatchCurrencies,
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

export function isSignupFlow(flow: PaymentMethodFlow): boolean {
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

/**
 * Report to Sentry that the plan name is incorrect.
 *
 * @param planName - The plan name to report.
 * @param context - The context of the plan name. In other words, in what context the plan name is used.
 * This is helpful for debugging.
 */
export function captureWrongPlanName(
    planName: string | undefined,
    context: {
        source: string;
        [key: string]: any;
    }
) {
    try {
        if (planName === PLANS.VPN) {
            captureMessage('Payments: wrong plan name', {
                level: 'warning',
                extra: { planName, ...context },
            });
        }
    } catch {}
}

/**
 * Report to Sentry that the plan IDs are incorrect. Sister function to `captureWrongPlanName`.
 *
 * @param planIDs - The plan IDs to report.
 * @param context - The context of the plan IDs. In other words, in what context the plan IDs are used.
 * This is helpful for debugging.
 */
export function captureWrongPlanIDs(
    planIDs: PlanIDs | undefined,
    context: {
        source: string;
        [key: string]: any;
    }
) {
    try {
        if (!planIDs) {
            return;
        }

        const planName = getPlanNameFromIDs(planIDs);
        if (planName === PLANS.VPN) {
            captureWrongPlanName(planName, { planIDs, ...context });
        }
    } catch {}
}

/**
 * Correct outdated plan names to the relevant ones.
 *
 * @param planName - The plan name to correct.
 * @param source - The source of the plan name. In other words, in what context the plan name is used.
 * This is helpful for debugging.
 * @returns The corrected plan name.
 */
export function fixPlanName(planName: PLANS, source: string): PLANS;
export function fixPlanName(planName: string, source: string): string;
export function fixPlanName(planName: PLANS | undefined, source: string): PLANS | undefined;
export function fixPlanName(planName: string | undefined, source: string): string | undefined;
export function fixPlanName(planName: string | null, source: string): string | null;
export function fixPlanName(planName: string | null | undefined, source: string): string | null | undefined {
    if (planName === PLANS.VPN) {
        captureWrongPlanName(planName, { source });
        return PLANS.VPN2024;
    }

    return planName;
}

/**
 * Correct outdated plan IDs to the relevant ones. A sister function to `fixPlanName`.
 *
 * @param planIDs - The plan IDs to correct.
 * @param source - The source of the plan IDs. In other words, in what context the plan IDs are used.
 * This is helpful for debugging.
 * @returns The corrected plan IDs.
 */
export function fixPlanIDs(planIDs: PlanIDs | undefined, source: string): PlanIDs | undefined {
    try {
        if (!planIDs || !planIDs[PLANS.VPN]) {
            return planIDs;
        }

        const planIDsCopy: PlanIDs = { ...planIDs };

        delete planIDsCopy[PLANS.VPN];
        planIDsCopy[PLANS.VPN2024] = 1;

        captureWrongPlanIDs(planIDsCopy, { source });

        return planIDsCopy;
    } catch {
        return planIDs;
    }
}
