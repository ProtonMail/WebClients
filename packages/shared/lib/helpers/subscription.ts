import { addWeeks, fromUnixTime, isBefore } from 'date-fns';
import { PLAN_TYPES, PLAN_SERVICES, PLANS, CYCLE, ADDON_NAMES, COUPON_CODES } from '../constants';
import { Subscription, Plan, PlanIDs } from '../interfaces';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS, VPNBASIC, VISIONARY, PROFESSIONAL } = PLANS;

export const getPlan = (subscription: Subscription | undefined, service: PLAN_SERVICES = MAIL) => {
    return (subscription?.Plans || []).find(({ Services, Type }) => Type === PLAN && Services & service);
};

export const getAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).filter(({ Type }) => Type === ADDON);
export const hasAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).some(({ Type }) => Type === ADDON);

export const getPlanName = (subscription: Subscription | undefined, service: PLAN_SERVICES = MAIL) => {
    const plan = getPlan(subscription, service);
    return plan?.Name;
};

const hasSomePlan = (subscription: Subscription | undefined, planName: PLANS) => {
    return (subscription?.Plans || []).some(({ Name }) => Name === planName);
};

export const hasLifetime = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.LIFETIME;
};

export const hasVisionary = (subscription: Subscription | undefined) => {
    return hasSomePlan(subscription, VISIONARY);
};

export const hasMailPlus = (subscription: Subscription | undefined) => {
    return hasSomePlan(subscription, PLUS);
};

export const hasMailProfessional = (subscription: Subscription | undefined) => {
    return hasSomePlan(subscription, PROFESSIONAL);
};

export const hasVpnBasic = (subscription: Subscription | undefined) => {
    return hasSomePlan(subscription, VPNBASIC);
};

export const hasVpnPlus = (subscription: Subscription | undefined) => {
    return hasSomePlan(subscription, VPNPLUS);
};

export const getMonthlyBaseAmount = (
    name: PLANS | ADDON_NAMES,
    plans: Plan[],
    subscription: Subscription | undefined
) => {
    const base = plans.find(({ Name }) => Name === name);
    if (!base) {
        return 0;
    }
    return (subscription?.Plans || [])
        .filter(({ Name }) => Name === name)
        .reduce((acc) => acc + base.Pricing[CYCLE.MONTHLY], 0);
};

export const getPlanIDs = (subscription: Subscription | undefined) => {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { ID, Quantity }) => {
        acc[ID] = acc[ID] || 0;
        acc[ID] += Quantity;
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
