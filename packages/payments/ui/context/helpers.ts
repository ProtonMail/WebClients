import isTruthy from '@proton/utils/isTruthy';

import type { CheckSubscriptionData } from '../../core/api/api';
import type { BillingAddress } from '../../core/billing-address/billing-address';
import { computeOptimisticCheckResult } from '../../core/computeOptimisticCheckResult';
import type { Currency, FreeSubscription, PaymentsApi } from '../../core/interface';
import { getAutoCoupon, isSubscriptionCheckForbidden } from '../../core/subscription/helpers';
import type { EnrichedCheckResponse, FullPlansMap, Subscription } from '../../core/subscription/interface';
import type { PlanToCheck } from './PaymentContext';
import type { useMultiCheckGroups } from './useMultiCheckGroups';

export const getSubscriptionDataFromPlanToCheck = ({
    planIDs,
    cycle,
    currency,
    coupon,
    trial = false,
    ValidateZipCode,
    VatId,
    BillingAddress,
}: PlanToCheck & {
    ValidateZipCode?: boolean;
    VatId: string | undefined;
    BillingAddress: BillingAddress;
}): CheckSubscriptionData => ({
    Plans: planIDs,
    Currency: currency,
    Cycle: cycle,
    Codes: coupon ? [coupon] : [],
    BillingAddress: {
        CountryCode: BillingAddress.CountryCode,
        State: BillingAddress.State,
        ZipCode: BillingAddress.ZipCode,
    },
    ValidateZipCode,
    IsTrial: trial,
    VatId,
});

/**
 * This is used only for non-critical checks. For example, loading the prices for multiple plans on page loading.
 * Example: there is a coupon and it needs to be checked with different cycles/plans/currencies, etc.
 */
export const checkMultiplePlans = async ({
    plansToCheck,
    subscription,
    paymentsApi,
    multiCheckGroups,
    getLocalizedPlansMap,
    billingAddress,
}: {
    plansToCheck: PlanToCheck[];
    subscription: Subscription | FreeSubscription;
    paymentsApi: PaymentsApi;
    multiCheckGroups: ReturnType<typeof useMultiCheckGroups>;
    getLocalizedPlansMap: (params: { paramCurrency?: Currency }) => FullPlansMap;
    billingAddress: BillingAddress;
}) => {
    const checkSubscriptionData = plansToCheck
        .map((planToCheck) =>
            getSubscriptionDataFromPlanToCheck({ ...planToCheck, BillingAddress: billingAddress, VatId: undefined })
        )
        .map((datum) => (isSubscriptionCheckForbidden(subscription, datum.Plans, datum.Cycle) ? null : datum));

    const indexesToExcludeFromCheck: number[] = [];
    const truthySubscriptionData = checkSubscriptionData.filter((data, index) => {
        if (data === null) {
            indexesToExcludeFromCheck.push(index);
        }

        return data !== null;
    });

    const resultsPromise = paymentsApi.multiCheck(truthySubscriptionData, { cached: true, silence: true });

    plansToCheck
        .map((planToCheck) => planToCheck.groupId)
        .filter(isTruthy)
        .forEach((groupId) => multiCheckGroups.addPromiseToGroup(groupId, resultsPromise));

    const results = await resultsPromise;
    const normalizedResults: EnrichedCheckResponse[] = [];

    let checkedIndex = 0;
    for (let index = 0; index < plansToCheck.length; index++) {
        if (indexesToExcludeFromCheck.includes(index)) {
            const planToCheck = plansToCheck[index];
            const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
            normalizedResults.push(
                computeOptimisticCheckResult({ plansMap, ...planToCheck }, subscription, { isTrial: planToCheck.trial })
            );
        } else {
            normalizedResults.push(results[checkedIndex]);
            checkedIndex++;
        }
    }

    return normalizedResults;
};

export function getPlanToCheck(params: PlanToCheck): PlanToCheck {
    const coupon = getAutoCoupon({
        coupon: params.coupon,
        planIDs: params.planIDs,
        cycle: params.cycle,
        trial: params.trial,
        currency: params.currency,
    });

    return { ...params, coupon };
}
