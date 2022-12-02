import { addWeeks, fromUnixTime, isBefore } from 'date-fns';

import { ADDON_NAMES, APPS, APP_NAMES, COUPON_CODES, CYCLE, PLANS, PLAN_SERVICES, PLAN_TYPES } from '../constants';
import { PlanIDs, PlansMap, Subscription } from '../interfaces';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;
const {
    PLUS,
    VPNPLUS,
    VPNBASIC,
    PROFESSIONAL,
    VISIONARY,
    NEW_VISIONARY,
    MAIL,
    MAIL_PRO,
    DRIVE,
    DRIVE_PRO,
    VPN,
    ENTERPRISE,
    BUNDLE,
    BUNDLE_PRO,
} = PLANS;

export const getPlan = (subscription: Subscription | undefined, service?: PLAN_SERVICES) => {
    return (subscription?.Plans || []).find(
        ({ Services, Type }) => Type === PLAN && (service === undefined ? true : hasBit(Services, service))
    );
};

export const getAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).filter(({ Type }) => Type === ADDON);
export const hasAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).some(({ Type }) => Type === ADDON);

export const getPlanName = (subscription: Subscription | undefined, service: PLAN_SERVICES) => {
    const plan = getPlan(subscription, service);
    return plan?.Name;
};

const hasSomePlan = (subscription: Subscription | undefined, planName: PLANS) => {
    return (subscription?.Plans || []).some(({ Name }) => Name === planName);
};

export const hasLifetime = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.LIFETIME;
};

export const hasMigrationDiscount = (subscription: Subscription) => {
    return subscription?.CouponCode?.startsWith('MIGRATION');
};

export const hasVisionary = (subscription: Subscription | undefined) => hasSomePlan(subscription, VISIONARY);
export const hasNewVisionary = (subscription: Subscription | undefined) => hasSomePlan(subscription, NEW_VISIONARY);
export const hasVPN = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPN);
export const hasMail = (subscription: Subscription | undefined) => hasSomePlan(subscription, MAIL);
export const hasMailPro = (subscription: Subscription | undefined) => hasSomePlan(subscription, MAIL_PRO);
export const hasDrive = (subscription: Subscription | undefined) => hasSomePlan(subscription, DRIVE);
export const hasDrivePro = (subscription: Subscription | undefined) => hasSomePlan(subscription, DRIVE_PRO);
export const hasEnterprise = (subscription: Subscription | undefined) => hasSomePlan(subscription, ENTERPRISE);
export const hasBundle = (subscription: Subscription | undefined) => hasSomePlan(subscription, BUNDLE);
export const hasBundlePro = (subscription: Subscription | undefined) => hasSomePlan(subscription, BUNDLE_PRO);
export const hasMailPlus = (subscription: Subscription | undefined) => hasSomePlan(subscription, PLUS);
export const hasMailProfessional = (subscription: Subscription | undefined) => hasSomePlan(subscription, PROFESSIONAL);
export const hasVpnBasic = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPNBASIC);
export const hasVpnPlus = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPNPLUS);
export const hasFree = (subscription: Subscription | undefined) => (subscription?.Plans || []).length === 0;

export const getUpgradedPlan = (subscription: Subscription | undefined, app: APP_NAMES) => {
    if (hasFree(subscription)) {
        switch (app) {
            case APPS.PROTONDRIVE:
                return PLANS.DRIVE;
            case APPS.PROTONVPN_SETTINGS:
                return PLANS.VPN;
            default:
            case APPS.PROTONMAIL:
                return PLANS.MAIL;
        }
    }
    if (hasBundle(subscription) || hasBundlePro(subscription)) {
        return PLANS.BUNDLE_PRO;
    }
    return PLANS.BUNDLE;
};

export const getIsB2BPlan = (planName: PLANS | ADDON_NAMES) => {
    return [MAIL_PRO, DRIVE_PRO, BUNDLE_PRO, ENTERPRISE].includes(planName as any);
};

export const getIsLegacyPlan = (planName: PLANS | ADDON_NAMES) => {
    return [VPNBASIC, VPNPLUS, PLUS, PROFESSIONAL, VISIONARY].includes(planName as any);
};

export const getHasB2BPlan = (subscription: Subscription | undefined) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsB2BPlan(Name));
};

export const getHasLegacyPlans = (subscription: Subscription | undefined) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsLegacyPlan(Name));
};

export const getPrimaryPlan = (subscription: Subscription | undefined, app: APP_NAMES) => {
    if (!subscription) {
        return;
    }
    if (getHasLegacyPlans(subscription)) {
        const mailPlan = getPlan(subscription, PLAN_SERVICES.MAIL);
        const vpnPlan = getPlan(subscription, PLAN_SERVICES.VPN);

        if (app === APPS.PROTONVPN_SETTINGS) {
            return vpnPlan || mailPlan;
        }

        return mailPlan || vpnPlan;
    }

    return getPlan(subscription);
};

export const getBaseAmount = (
    name: PLANS | ADDON_NAMES,
    plansMap: PlansMap,
    subscription: Subscription | undefined,
    cycle = CYCLE.MONTHLY
) => {
    const base = plansMap[name];
    if (!base) {
        return 0;
    }
    return (subscription?.Plans || [])
        .filter(({ Name }) => Name === name)
        .reduce((acc) => {
            const pricePerCycle = base.Pricing[cycle] || 0;
            return acc + pricePerCycle;
        }, 0);
};

export const getPlanIDs = (subscription: Subscription | undefined): PlanIDs => {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { Name, Quantity }) => {
        acc[Name] = (acc[Name] || 0) + Quantity;
        return acc;
    }, {});
};

export const isTrial = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.REFERRAL;
};

export const isTrialExpired = (subscription: Subscription | undefined) => {
    const now = new Date();
    return now > fromUnixTime(subscription?.PeriodEnd || 0);
};

export const willTrialExpire = (subscription: Subscription | undefined) => {
    const now = new Date();
    return isBefore(fromUnixTime(subscription?.PeriodEnd || 0), addWeeks(now, 1));
};

export const isExternal = (subscription: Subscription | undefined) => {
    return !!subscription?.External;
};

export const hasBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return [
        COUPON_CODES.BLACK_FRIDAY_2022,
        COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
        COUPON_CODES.VPN_BLACK_FRIDAY_2022,
    ].includes(subscription?.CouponCode as COUPON_CODES);
};

export const hasVPNBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.VPN_BLACK_FRIDAY_2022;
};

export const hasMailBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.MAIL_BLACK_FRIDAY_2022;
};

export const allCycles = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS, CYCLE.FIFTEEN, CYCLE.THIRTY];
export const customCycles = [CYCLE.FIFTEEN, CYCLE.THIRTY];

export const getValidCycle = (cycle: number): CYCLE | undefined => {
    return allCycles.includes(cycle) ? cycle : undefined;
};

export function getNormalCycleFromCustomCycle(cycle: CYCLE): CYCLE;

export function getNormalCycleFromCustomCycle(cycle: CYCLE | undefined): CYCLE | undefined {
    if (!cycle) {
        return undefined;
    }
    if (cycle === CYCLE.FIFTEEN) {
        return CYCLE.YEARLY;
    }
    if (cycle === CYCLE.THIRTY) {
        return CYCLE.TWO_YEARS;
    }
    return cycle;
}

export const hasYearly = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.YEARLY;
};

export const hasMonthly = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.MONTHLY;
};

export const hasTwoYears = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.TWO_YEARS;
};
