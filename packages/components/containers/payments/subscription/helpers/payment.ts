import {
    COUPON_CODES,
    CYCLE,
    type Currency,
    type FreeSubscription,
    PLANS,
    type PlanIDs,
    type PlansMap,
    Renew,
    type Subscription,
    VPN_PASS_PROMOTION_COUPONS,
    getPlanFromIDs,
    getPlanTitle,
    isFreeSubscription,
    isRegionalCurrency,
} from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

export const getBundleProPlanToUse = ({ plansMap, planIDs }: { plansMap: PlansMap; planIDs: PlanIDs | undefined }) => {
    // If the user is on the bundlepro2022 plan, we keep showing that
    if (planIDs?.[PLANS.BUNDLE_PRO]) {
        return PLANS.BUNDLE_PRO;
    }
    if (plansMap[PLANS.BUNDLE_PRO_2024]) {
        return PLANS.BUNDLE_PRO_2024;
    }
    if (plansMap[PLANS.BUNDLE_PRO]) {
        return PLANS.BUNDLE_PRO;
    }
    return PLANS.BUNDLE_PRO_2024;
};

export const getIsVPNPassPromotion = (coupon: string | undefined, currency: Currency | undefined) => {
    return VPN_PASS_PROMOTION_COUPONS.includes(coupon as any) && (!currency || !isRegionalCurrency(currency));
};

export const getDefaultSelectedProductPlans = ({ appName, plan }: { appName: ProductParam; plan?: string }) => {
    let defaultB2CPlan = PLANS.MAIL;
    if (appName === APPS.PROTONVPN_SETTINGS) {
        defaultB2CPlan = PLANS.VPN2024;
    } else if (appName === APPS.PROTONDRIVE || appName === APPS.PROTONDOCS) {
        defaultB2CPlan = PLANS.DRIVE;
    } else if (appName === APPS.PROTONPASS) {
        defaultB2CPlan = PLANS.PASS;
    } else if (appName === APPS.PROTONLUMO) {
        defaultB2CPlan = PLANS.LUMO;
    }

    const matchingB2CPlan = [PLANS.MAIL, PLANS.VPN2024, PLANS.DRIVE].find((planName) => plan === planName);
    const matchingB2BPlan = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO].find((planName) => plan === planName);
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
export function subscriptionExpires(subscription: undefined | null, cancelled?: boolean): FreeSubscriptionResult;
export function subscriptionExpires(subscription: FreeSubscription, cancelled?: boolean): FreeSubscriptionResult;
export function subscriptionExpires(subscription: Subscription | undefined, cancelled?: boolean): SubscriptionResult;
export function subscriptionExpires(subscription: Subscription, cancelled?: boolean): SubscriptionResult;
export function subscriptionExpires(
    subscription?: Subscription | FreeSubscription | null,
    cancelled = false
): FreeSubscriptionResult | SubscriptionResult {
    if (!subscription || isFreeSubscription(subscription)) {
        return {
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        };
    }

    const latestSubscription = (() => {
        if (subscription.Renew === Renew.Disabled || cancelled) {
            return subscription;
        }

        return subscription.UpcomingSubscription ?? subscription;
    })();
    const renewDisabled = latestSubscription.Renew === Renew.Disabled || cancelled;
    const renewEnabled = !renewDisabled;
    const subscriptionExpiresSoon = renewDisabled;

    // This will never be undefined but the empty string is here to make TS happy
    const planName = getPlanTitle(latestSubscription) ?? '';

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

const getVpnAutoCoupon = ({ coupon, planIDs, cycle }: Parameters<typeof getAutoCoupon>[0]) => {
    // user already provided a coupon
    if (coupon) {
        return;
    }

    const planAndCycleMatch =
        [PLANS.VPN2024].some((plan) => planIDs?.[plan]) && [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle as any);
    if (!planAndCycleMatch) {
        return;
    }

    return COUPON_CODES.VPN_INTRO_2025;
};

export const getAutoCoupon = ({
    planIDs,
    cycle,
    coupon,
    trial,
    currency,
}: {
    planIDs: PlanIDs;
    cycle: CYCLE;
    currency: Currency;
    coupon?: string | null;
    trial?: boolean;
}) => {
    // Don't apply automatic coupons for trials
    if (trial) {
        return coupon || undefined;
    }

    const vpnAutoCoupon = getVpnAutoCoupon({ coupon, planIDs, cycle, currency });
    if (vpnAutoCoupon) {
        return vpnAutoCoupon;
    }

    return coupon || undefined;
};

export function notHigherThanAvailableOnBackend(planIDs: PlanIDs, plansMap: PlansMap, cycle: CYCLE): CYCLE {
    const plan = getPlanFromIDs(planIDs, plansMap);
    if (!plan) {
        return cycle;
    }

    const availableCycles = Object.keys(plan.Pricing) as unknown as CYCLE[];
    const maxCycle = Math.max(...availableCycles) as CYCLE;
    return Math.min(cycle, maxCycle);
}
