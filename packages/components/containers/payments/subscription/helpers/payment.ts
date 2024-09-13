import type { BillingAddress } from '@proton/payments';
import { isRegionalCurrency } from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { FreeSubscription } from '@proton/shared/lib/constants';
import {
    APPS,
    COUPON_CODES,
    CYCLE,
    PLANS,
    VPN_PASS_PROMOTION_COUPONS,
    isFreeSubscription,
} from '@proton/shared/lib/constants';
import { getPlanFromIds } from '@proton/shared/lib/helpers/planIDs';
import type { Currency, PlanIDs, PlansMap, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { Audience, Renew } from '@proton/shared/lib/interfaces';

export const getVPNPlanToUse = ({
    planIDs,
}: {
    plansMap: PlansMap;
    planIDs: PlanIDs | undefined;
    cycle: CYCLE | undefined;
}) => {
    // If the user is on the vpn2022 plan, we keep showing that
    if (planIDs?.[PLANS.VPN]) {
        return PLANS.VPN;
    }
    return PLANS.VPN2024;
};

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

export const getIsVpn2024Deal = (planName: PLANS, coupon: string | undefined) => {
    return (
        planName === PLANS.VPN2024 &&
        [COUPON_CODES.MARCHSAVINGS24, COUPON_CODES.HONEYPROTONSAVINGS, COUPON_CODES.PREMIUM_DEAL].includes(
            coupon as COUPON_CODES
        )
    );
};

export const getDefaultSelectedProductPlans = ({
    appName,
    plan,
    planIDs,
    plansMap,
    cycle,
}: {
    appName: ProductParam;
    plan?: string;
    planIDs: PlanIDs;
    cycle: CYCLE | undefined;
    plansMap: PlansMap;
}) => {
    let defaultB2CPlan = PLANS.MAIL;
    if (appName === APPS.PROTONVPN_SETTINGS) {
        defaultB2CPlan = getVPNPlanToUse({ plansMap, planIDs, cycle });
    } else if (appName === APPS.PROTONDRIVE) {
        defaultB2CPlan = PLANS.DRIVE;
    } else if (appName === APPS.PROTONPASS) {
        defaultB2CPlan = PLANS.PASS;
    } else if (appName === APPS.PROTONWALLET) {
        defaultB2CPlan = PLANS.WALLET;
    }

    const matchingB2CPlan = [PLANS.MAIL, PLANS.VPN, /*PLANS.VPN2024, */ PLANS.DRIVE, PLANS.WALLET].find(
        (planName) => plan === planName || planIDs[planName]
    );
    const matchingB2BPlan = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO].find(
        (planName) => plan === planName || planIDs[planName]
    );
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
export function subscriptionExpires(subscription: SubscriptionModel | undefined): SubscriptionResult;
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

export const getAutoCoupon = ({
    planIDs,
    cycle,
    coupon,
}: {
    planIDs: PlanIDs;
    cycle: CYCLE;
    coupon?: string | null;
}) => {
    if (!coupon && [PLANS.PASS_BUSINESS, PLANS.PASS_PRO].some((plan) => planIDs?.[plan])) {
        return COUPON_CODES.PASS_B2B_INTRO;
    }

    if (!coupon && [PLANS.DRIVE_BUSINESS].some((plan) => planIDs?.[plan])) {
        return COUPON_CODES.DRIVEB2BINTRO2024;
    }

    if (
        !coupon &&
        [PLANS.VPN2024].some((plan) => planIDs?.[plan]) &&
        [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle as any)
    ) {
        return COUPON_CODES.VPN_INTRO_2024;
    }

    return coupon || undefined;
};

export function notHigherThanAvailableOnBackend(planIDs: PlanIDs, plansMap: PlansMap, cycle: CYCLE): CYCLE {
    const planID = getPlanFromIds(planIDs);
    if (!planID) {
        return cycle;
    }

    const plan = plansMap[planID];
    if (!plan) {
        return cycle;
    }

    const availableCycles = Object.keys(plan.Pricing) as unknown as CYCLE[];
    const maxCycle = Math.max(...availableCycles) as CYCLE;
    return Math.min(cycle, maxCycle);
}

export const countriesWithStates = Object.freeze(['US', 'CA']);

export type BillingAddressStatus =
    | {
          valid: true;
          reason: undefined;
      }
    | {
          valid: false;
          reason: 'missingCountry' | 'missingState';
      };

export const BILLING_ADDRESS_VALID = Object.freeze({ valid: true, reason: undefined }) as BillingAddressStatus;

export function getBillingAddressStatus(billingAddress: BillingAddress): BillingAddressStatus {
    if (!billingAddress.CountryCode) {
        return { valid: false, reason: 'missingCountry' };
    }

    const isCountryWithState = countriesWithStates.includes(billingAddress.CountryCode);
    if (!isCountryWithState) {
        return BILLING_ADDRESS_VALID;
    }

    if (!billingAddress.State) {
        return { valid: false, reason: 'missingState' };
    }

    return BILLING_ADDRESS_VALID;
}
