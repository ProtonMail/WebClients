import { differenceInDays, differenceInMonths, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import type { CYCLE } from '@proton/payments/core/constants';
import type { Currency, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { computeOptimisticSubscriptionMode } from '@proton/payments/core/optimisticSubscriptionMode';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import { isSubscriptionCheckForbidden } from '@proton/payments/core/subscription/helpers';
import type { Subscription, SubscriptionCheckResponse } from '@proton/payments/core/subscription/interface';
import type { PlanToCheck } from '@proton/payments/ui';
import { getPlanToCheck } from '@proton/payments/ui/context/helpers';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

const getMonthsText = (n: number) => {
    return c('Checkout row').ngettext(msgid`${n} month`, `${n} months`, n);
};

const getDaysText = (n: number) => {
    return c('Checkout row').ngettext(msgid`${n} day`, `${n} days`, n);
};

export const getCodesForSubscription = (userEnteredCouponCode: string | undefined, coupon: string | undefined) => {
    return [userEnteredCouponCode, coupon].filter(isTruthy);
};

export function getDisplayName(organization: OrganizationExtended | undefined, user: UserModel | undefined) {
    return (
        organization?.DisplayName ||
        organization?.Name ||
        organization?.Email ||
        user?.DisplayName ||
        user?.Name ||
        user?.Email
    );
}

export async function runAdditionalCycleChecks(
    allowedCycles: CYCLE[],
    checkResult: SubscriptionCheckResponse & {
        requestData: CheckSubscriptionData;
    },
    subscription: Subscription | FreeSubscription | undefined,
    planIDs: PlanIDs,
    plansMap: PlansMap,
    currency: Currency,
    coupon: string | undefined,
    checkMultiplePlans: (planToCheck: PlanToCheck[]) => Promise<SubscriptionCheckResponse[]>
) {
    const additionalCycles = allowedCycles
        .filter((cycle) => cycle !== checkResult.Cycle)
        .filter((cycle) => !isSubscriptionCheckForbidden(subscription, planIDs, cycle));

    const additionalCyclesHaveCustomBilling =
        subscription &&
        additionalCycles.some((cycle) => {
            const optimisticSubscriptionMode = computeOptimisticSubscriptionMode(
                {
                    planIDs: checkResult.requestData.Plans,
                    cycle,
                    currency: checkResult.requestData.Currency,
                    plansMap,
                },
                subscription
            );

            return optimisticSubscriptionMode === SubscriptionMode.CustomBillings;
        });
    const currentCycleHasCustomBilling = checkResult.SubscriptionMode === SubscriptionMode.CustomBillings;

    const additionalPayloads = additionalCycles.map((cycle) =>
        getPlanToCheck({
            planIDs,
            cycle,
            currency,
            coupon: coupon ?? checkResult.Coupon?.Code,
        })
    );
    const noCoupons = additionalPayloads.every((payload) => !payload.coupon || payload.coupon.length === 0);
    if (currentCycleHasCustomBilling || additionalCyclesHaveCustomBilling || noCoupons) {
        return [];
    }

    return checkMultiplePlans(additionalPayloads);
}

export const getTrialPeriodText = (subscription: Subscription) => {
    if (subscription.IsTrial) {
        const startDate = fromUnixTime(subscription.PeriodStart);
        const endDate = fromUnixTime(subscription.PeriodEnd);
        const periodInDays = differenceInDays(endDate, startDate);
        const periodInMonths = differenceInMonths(endDate, startDate);
        if (periodInMonths) {
            return getMonthsText(periodInMonths);
        }
        return getDaysText(periodInDays);
    }
};
