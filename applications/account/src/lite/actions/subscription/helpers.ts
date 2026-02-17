import { differenceInDays, differenceInMonths, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import type { ADDON_NAMES } from '@proton/payments/core/constants';
import { CYCLE } from '@proton/payments/core/constants';
import type { Currency, Cycle, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { computeOptimisticSubscriptionMode } from '@proton/payments/core/optimisticSubscriptionMode';
import { isDomainAddon, isIpAddon, isLumoAddon, isMemberAddon, isScribeAddon } from '@proton/payments/core/plan/addons';
import {
    getIsB2BAudienceFromPlan,
    getPlanNameFromIDs,
    isLifetimePlanSelected,
} from '@proton/payments/core/plan/helpers';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import { isSubscriptionCheckForbidden } from '@proton/payments/core/subscription/helpers';
import type { Subscription, SubscriptionCheckResponse } from '@proton/payments/core/subscription/interface';
import type { PlanToCheck } from '@proton/payments/ui';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { getPlanToCheck } from '@proton/payments/ui/context/helpers';
import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
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

export const getBillingPeriodText = (cycle: Cycle, planIDs: PlanIDs) => {
    if (isLifetimePlanSelected(planIDs)) {
        return c('Checkout row').t`Forever access`;
    } else if (cycle === CYCLE.YEARLY || cycle === CYCLE.TWO_YEARS) {
        const years = cycle / CYCLE.YEARLY;
        return c('Checkout row').ngettext(msgid`${years} year`, `${years} years`, years);
    } else {
        return getMonthsText(cycle);
    }
};

export const getAddonTitle = (addonName: ADDON_NAMES, quantity: number, planIDs: PlanIDs) => {
    if (isDomainAddon(addonName)) {
        const domains = quantity;
        return c('Addon').ngettext(msgid`${domains} custom email domain`, `${domains} custom email domains`, domains);
    }
    if (isMemberAddon(addonName)) {
        const users = quantity;
        return c('Addon').ngettext(msgid`${users} user`, `${users} users`, users);
    }
    if (isIpAddon(addonName)) {
        const ips = quantity;
        return c('Addon').ngettext(msgid`${ips} dedicated VPN server`, `${ips} dedicated VPN servers`, ips);
    }

    const plan = getPlanNameFromIDs(planIDs);
    const isB2C = !getIsB2BAudienceFromPlan(plan);

    if (isScribeAddon(addonName)) {
        if (isB2C) {
            return c('Info').t`Writing assistant`;
        }
        const seats = quantity;
        // translator: sentence is "1 writing assistant seat" or "2 writing assistant seats"
        return c('Addon').ngettext(msgid`${seats} writing assistant seat`, `${seats} writing assistant seats`, seats);
    }

    if (isLumoAddon(addonName)) {
        const seats = quantity;
        if (isB2C) {
            return c('Addon').ngettext(
                msgid`${seats} ${LUMO_APP_NAME} AI license`,
                `${seats} ${LUMO_APP_NAME} AI licenses`,
                seats
            );
        }

        return c('Addon').ngettext(msgid`${seats} ${LUMO_APP_NAME} seat`, `${seats} ${LUMO_APP_NAME} seats`, seats);
    }

    return '';
};

export const useMemberAddonPrice = () => {
    const { checkoutUi, couponConfig } = usePayments();
    const { addons, membersPerMonth, withDiscountPerMonth, withDiscountMembersPerMonth, discountTarget } = checkoutUi;
    const noAddonsAndCouponIsHidden = !!couponConfig?.hidden && addons.length === 0;

    let membersAmount: number;
    if (discountTarget === 'base-users') {
        membersAmount = withDiscountMembersPerMonth;
    } else if (noAddonsAndCouponIsHidden) {
        membersAmount = withDiscountPerMonth;
    } else {
        membersAmount = membersPerMonth;
    }
    return membersAmount;
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

export const getTrailPeriodText = (subscription: Subscription) => {
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
