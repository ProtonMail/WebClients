import { getUnixTime } from 'date-fns';

import { LatestSubscription } from '@proton/components/payments/core';
import { ProductParam } from '@proton/shared/lib/apps/product';
import {
    APPS,
    CYCLE,
    DEFAULT_CURRENCY,
    FreeSubscription,
    PLANS,
    PLAN_SERVICES,
    isFreeSubscription,
} from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { hasVpnBasic, hasVpnPlus } from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    Cycle,
    Plan,
    PlanIDs,
    Renew,
    Subscription,
    SubscriptionModel,
    UserModel,
} from '@proton/shared/lib/interfaces';

const OCTOBER_01 = getUnixTime(new Date(Date.UTC(2021, 9, 1)));

/**
 * Calculate total for a specific subscription configuration
 */
export const getSubTotal = ({
    plansMap,
    cycle,
    plans,
    services,
}: {
    plansMap: { [key: string]: number };
    cycle: Cycle;
    plans: Plan[];
    services?: PLAN_SERVICES;
}) => {
    return Object.entries(plansMap).reduce<number>((acc, [planName, quantity]) => {
        if (!quantity) {
            return acc;
        }
        const plan = plans.find(({ Name, Services }) => {
            if (services) {
                return Name === planName && hasBit(Services, services);
            }
            return Name === planName;
        });
        const amount = plan?.Pricing?.[cycle] || 0;
        return acc + quantity * amount;
    }, 0);
};

/**
 * Check if the current user is eligible to Black Friday discount
 */
export const getBlackFridayEligibility = (subscription: Subscription, latestSubscription?: LatestSubscription) => {
    if (subscription?.Plans?.length === 1) {
        // Eligible if you are on a vpn plus and monthly cycle
        if (hasVpnPlus(subscription) && subscription.Plans[0]?.Cycle === CYCLE.MONTHLY) {
            return true;
        }

        // Eligible if you are on a vpn basic
        if (hasVpnBasic(subscription)) {
            return true;
        }
    }

    // Anyone else who had a paid plan at any point in time after Oct 2021 is not eligible
    if ((latestSubscription?.LastSubscriptionEnd ?? 0) > OCTOBER_01) {
        return false;
    }

    // Eligible if free plan
    if (!subscription?.Plans?.length) {
        return true;
    }

    return false;
};

export const getCurrency = (
    user: UserModel | undefined,
    subscription: Subscription | undefined,
    plans: Plan[] | undefined
) => {
    return user?.Currency || subscription?.Currency || plans?.[0]?.Currency || DEFAULT_CURRENCY;
};

export const getDefaultSelectedProductPlans = (appName: ProductParam, planIDs: PlanIDs) => {
    let defaultB2CPlan = PLANS.MAIL;
    if (appName === APPS.PROTONVPN_SETTINGS) {
        defaultB2CPlan = PLANS.VPN;
    } else if (appName === APPS.PROTONDRIVE) {
        defaultB2CPlan = PLANS.DRIVE;
    } else if (appName === APPS.PROTONPASS) {
        defaultB2CPlan = PLANS.PASS_PLUS;
    }
    const matchingB2CPlan = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE].find((x) => planIDs[x]);
    const matchingB2BPlan = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO].find((x) => planIDs[x]);
    const defaultB2BPlan = PLANS.MAIL_PRO;
    return {
        [Audience.B2C]: matchingB2CPlan || defaultB2CPlan,
        [Audience.B2B]: matchingB2BPlan || defaultB2BPlan,
        [Audience.FAMILY]: PLANS.FAMILY,
    };
};
export type SelectedProductPlans = ReturnType<typeof getDefaultSelectedProductPlans>;

interface FreeSubscriptionResult {
    subscriptionExpiresSoon: false;
    renewDisabled: false;
    renewEnabled: true;
    expirationDate: null;
}

type SubscriptionResult = {
    renewDisabled: boolean;
    renewEnabled: boolean;
    planName: string;
} & (
    | {
          subscriptionExpiresSoon: true;
          expirationDate: number;
      }
    | {
          subscriptionExpiresSoon: false;
          expirationDate: null;
      }
);

export function subscriptionExpires(): FreeSubscriptionResult;
export function subscriptionExpires(subscription: undefined | null): FreeSubscriptionResult;
export function subscriptionExpires(subscription: FreeSubscription): FreeSubscriptionResult;
export function subscriptionExpires(subscription: SubscriptionModel): SubscriptionResult;
export function subscriptionExpires(
    subscription?: SubscriptionModel | FreeSubscription | null
): FreeSubscriptionResult | SubscriptionResult {
    if (!subscription || isFreeSubscription(subscription)) {
        return {
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        };
    }

    const latestSubscription = subscription.UpcomingSubscription ?? subscription;
    const renewDisabled = latestSubscription.Renew === Renew.Disabled;
    const renewEnabled = latestSubscription.Renew === Renew.Enabled;
    const subscriptionExpiresSoon = renewDisabled;

    const planName = latestSubscription.Plans?.[0]?.Title;

    if (subscriptionExpiresSoon) {
        return {
            subscriptionExpiresSoon,
            renewDisabled,
            renewEnabled,
            planName,
            expirationDate: latestSubscription.PeriodEnd,
        };
    } else {
        return {
            subscriptionExpiresSoon,
            renewDisabled,
            renewEnabled,
            planName,
            expirationDate: null,
        };
    }
}
