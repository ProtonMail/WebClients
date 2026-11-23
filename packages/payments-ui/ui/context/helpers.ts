import isEqual from 'lodash/isEqual';

import type { InitializeProps } from '@proton/payments-hooks/ui/context/paymentsContext';
import type { useMultiCheckGroups } from '@proton/payments-hooks/ui/context/useMultiCheckGroups';
import { getPreferredPlansMap } from '@proton/payments-hooks/ui/hooks/usePreferredPlansMap';
import {
    type BillingAddress,
    type BillingAddressExtended,
    type BillingAddressExtraProperties,
    DEFAULT_TAX_BILLING_ADDRESS,
} from '@proton/payments/core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '@proton/payments/core/billing-address/billing-address-from-payments-status';
import { computeOptimisticCheckResult } from '@proton/payments/core/computeOptimisticCheckResult';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { getPreferredCurrency, mainCurrencies } from '@proton/payments/core/currencies';
import { emptyEntitlementCatalog } from '@proton/payments/core/entitlements/empty-entitlement-catalog';
import type { EntitlementCatalog } from '@proton/payments/core/entitlements/interface';
import type { Currency, FreeSubscription, PaymentStatus, PaymentsApi } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import {
    isSubscriptionCheckForbidden,
    isSubscriptionSelectionEqual,
    shouldPassIsTrial,
} from '@proton/payments/core/subscription/helpers';
import { getPlanIDs } from '@proton/payments/core/subscription/helpers/plan-ids';
import type { FullPlansMap, Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import {
    type MultiSubscriptionContext,
    createMultiSubscriptionContext,
} from '@proton/payments/core/subscription/multi-subscription-context';
import {
    type PlanToCheck,
    getPlanToCheck,
    getSubscriptionDataFromPlanToCheck,
} from '@proton/payments/core/subscription/plan-to-check';
import { getChangedSubscription } from '@proton/payments/core/subscription/purchase-eligibility';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { EstimationChangeAction } from '@proton/payments/telemetry/shared-checkout-telemetry';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { getPlanFromPlanIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/payments/plan/interface';
import isTruthy from '@proton/utils/isTruthy';

export type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
export { getPlanToCheck, getSubscriptionDataFromPlanToCheck } from '@proton/payments/core/subscription/plan-to-check';

/**
 * This is used only for non-critical checks. For example, loading the prices for multiple plans on page loading.
 * Example: there is a coupon and it needs to be checked with different cycles/plans/currencies, etc.
 */
export const checkMultiplePlans = async ({
    plansToCheck,
    paymentsApi,
    multiCheckGroups,
    getLocalizedPlansMap,
    billingAddress,
    multiSubscriptionContext,
}: {
    plansToCheck: PlanToCheck[];
    paymentsApi: PaymentsApi;
    multiCheckGroups: ReturnType<typeof useMultiCheckGroups>;
    getLocalizedPlansMap: (params: { paramCurrency?: Currency }) => FullPlansMap;
    billingAddress: BillingAddress;
    multiSubscriptionContext: MultiSubscriptionContext;
}) => {
    if (plansToCheck.length === 0) {
        return [];
    }

    const checkSubscriptionData = plansToCheck
        .map((planToCheck) =>
            getSubscriptionDataFromPlanToCheck({ ...planToCheck, BillingAddress: billingAddress, VatId: undefined })
        )
        .map((datum) =>
            isSubscriptionCheckForbidden(multiSubscriptionContext, {
                planIDs: datum.Plans,
                cycle: datum.Cycle,
            })
                ? null
                : datum
        );

    const indexesToExcludeFromCheck: number[] = [];
    const truthySubscriptionData = checkSubscriptionData.filter((data, index) => {
        if (data === null) {
            indexesToExcludeFromCheck.push(index);
        }

        return data !== null;
    });

    const currency = plansToCheck.at(0)?.currency;
    const plansMap = getLocalizedPlansMap({ paramCurrency: currency });
    const resultsPromise = paymentsApi.multiCheck(truthySubscriptionData, { silence: true, plansMap });

    plansToCheck
        .map((planToCheck) => planToCheck.groupId)
        .filter(isTruthy)
        .forEach((groupId) => multiCheckGroups.addPromiseToGroup(groupId, resultsPromise));

    const results = await resultsPromise;
    const normalizedResults: SubscriptionEstimation[] = [];

    let checkedIndex = 0;
    for (let index = 0; index < plansToCheck.length; index++) {
        if (indexesToExcludeFromCheck.includes(index)) {
            const planToCheck = plansToCheck[index];
            normalizedResults.push(
                computeOptimisticCheckResult(
                    { plansMap, ...planToCheck },
                    getChangedSubscription(multiSubscriptionContext, planToCheck.planIDs),
                    { isTrial: planToCheck.trial }
                )
            );
        } else {
            normalizedResults.push(results[checkedIndex]);
            checkedIndex++;
        }
    }

    return normalizedResults;
};

export interface PaymentsContextProviderState {
    telemetryContext: PaymentTelemetryContext;
    product: ProductParam;
    billingAddress: BillingAddressExtended;
    subscription: Subscription | FreeSubscription;
    entitlementCatalog: EntitlementCatalog;
    plansData: {
        plans: Plan[];
        freePlan: FreePlanDefault;
    };
    paymentStatus: PaymentStatus | undefined;
    initialized: boolean;
    availableCurrencies: readonly Currency[];
    planToCheck: PlanToCheck;
    checkResult: SubscriptionEstimation;
    vatNumber: string | undefined;
    loading: boolean;
}

export const toMultiSubscriptionContext = (
    lumoMultiSubscriptions: boolean,
    { subscription, entitlementCatalog }: Pick<PaymentsContextProviderState, 'subscription' | 'entitlementCatalog'>
): MultiSubscriptionContext =>
    createMultiSubscriptionContext({
        lumoMultiSubscriptions,
        subscription,
        entitlementCatalog: entitlementCatalog === emptyEntitlementCatalog ? undefined : entitlementCatalog,
    });

export const getLocalizedPlansMapForUser = (params: {
    user: UserModel | undefined;
    paramCurrency?: Currency;
    paymentStatus: PaymentStatus | undefined;
    multiSubscriptionContext: MultiSubscriptionContext;
    plans: Plan[];
}) =>
    getPreferredPlansMap({
        currencyFallback: false,
        currencyOverrides: params.paramCurrency ? { paramCurrency: params.paramCurrency } : undefined,
        user: params.user,
        paymentStatus: params.paymentStatus,
        multiSubscriptionContext: params.multiSubscriptionContext,
        plans: params.plans,
    }).plansMap;

export const getInitialState = ({
    user,
    subscription = FREE_SUBSCRIPTION,
    plansData,
    cachedPlans,
    paymentStatus,
    entitlementCatalog = emptyEntitlementCatalog,
    authenticated,
    lumoMultiSubscriptions,
}: {
    user: UserModel | undefined;
    subscription: Subscription | FreeSubscription | undefined;
    plansData: PaymentsContextProviderState['plansData'] | undefined;
    cachedPlans: Plan[] | undefined;
    paymentStatus: PaymentStatus | undefined;
    entitlementCatalog: EntitlementCatalog | undefined;
    authenticated: boolean;
    lumoMultiSubscriptions: boolean;
}): PaymentsContextProviderState => {
    const plans = plansData ?? { plans: cachedPlans ?? [], freePlan: FREE_PLAN };
    const billingAddress = paymentStatus
        ? getBillingAddressFromPaymentStatus(paymentStatus, { shouldRestoreZipCode: !authenticated })
        : DEFAULT_TAX_BILLING_ADDRESS;

    const multiSubscriptionContext = toMultiSubscriptionContext(lumoMultiSubscriptions, {
        subscription,
        entitlementCatalog,
    });
    const currency = getPreferredCurrency({ user, multiSubscriptionContext, plans: plans.plans, paymentStatus });
    const plansMap = getLocalizedPlansMapForUser({
        user,
        paramCurrency: currency,
        paymentStatus,
        multiSubscriptionContext,
        plans: plans.plans,
    });

    const planIDs = isFreeSubscription(subscription) ? { [PLANS.MAIL]: 1 } : getPlanIDs(subscription);
    const cycle = CYCLE.MONTHLY;
    const trial = shouldPassIsTrial({
        plansMap,
        newPlanIDs: planIDs,
        newCycle: cycle,
        downgradeIsTrial: true,
        subscription,
        entitlementCatalog,
    });
    const planToCheck = { cycle, currency, planIDs, coupon: undefined, trial };
    const checkResult = computeOptimisticCheckResult(
        { cycle, planIDs, plansMap, currency },
        getChangedSubscription(multiSubscriptionContext, planIDs),
        { isTrial: trial }
    );

    return {
        telemetryContext: 'other',
        product: 'generic',
        billingAddress,
        subscription,
        plansData: plans,
        paymentStatus,
        initialized: false,
        availableCurrencies: mainCurrencies,
        planToCheck,
        checkResult,
        vatNumber: undefined,
        loading: false,
        entitlementCatalog,
    };
};

/** The telemetry action of a selection change, null when nothing changed */
export const getEstimationChangeAction = (current: PlanToCheck, next: PlanToCheck): EstimationChangeAction | null => {
    if (next.cycle !== current.cycle) {
        return 'cycle_changed';
    }
    if (next.currency !== current.currency) {
        return 'currency_changed';
    }
    if (next.coupon !== current.coupon) {
        return 'coupon_changed';
    }
    if (!isEqual(next.planIDs, current.planIDs)) {
        return 'plan_changed';
    }
    return null;
};

/**
 * The plans of `availablePlans` worth a price check in `currency`: with a coupon, in a currency the plan has, and not
 * the selection, whose own check caches its price. A plan without a `coupon` key takes `selectionCoupon`.
 */
export const getAvailablePlansToCheck = ({
    availablePlans = [],
    selection,
    selectionCoupon,
    currency,
    plansMap,
}: {
    availablePlans: InitializeProps['availablePlans'];
    selection: PlanToCheck | undefined;
    selectionCoupon: string | undefined;
    currency: Currency;
    plansMap: FullPlansMap;
}): PlanToCheck[] =>
    availablePlans
        .map((plan) => getPlanToCheck({ ...plan, currency, coupon: 'coupon' in plan ? plan.coupon : selectionCoupon }))
        .filter((plan) => {
            // There needs to be a coupon for it to be worth to ask the API.
            const hasCoupon = !!plan.coupon;
            // With regional currencies, the currency might not exist for that plan. So ignore asking the API in that case.
            const hasCurrency = plan.currency === getPlanFromPlanIDs(plansMap, plan.planIDs)?.Currency;
            const isSelection =
                !!selection &&
                isSubscriptionSelectionEqual(plan, selection) &&
                plan.coupon === selection.coupon &&
                !!plan.trial === !!selection.trial;
            return hasCoupon && hasCurrency && !isSelection;
        });

// The details only fill in the fields the address doesn't have, so what the user typed in the form wins, even a field
// they cleared. A missing detail isn't added as an empty field, which the subscription rejects
export const withBillingDetails = (
    billingAddress: BillingAddressExtended,
    billingDetails: BillingAddressExtraProperties | undefined
): BillingAddressExtended => ({
    ...Object.fromEntries(Object.entries(billingDetails ?? {}).filter(([, value]) => value)),
    ...billingAddress,
});
