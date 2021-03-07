import { PLAN_TYPES, PLAN_SERVICES, PLANS, CYCLE } from '../constants';
import { Subscription, Plan, PlanIDs } from '../interfaces';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS, VPNBASIC, VISIONARY, PROFESSIONAL } = PLANS;

export const getPlan = ({ Plans = [] }: Subscription, service: PLAN_SERVICES = MAIL) => {
    return Plans.find(({ Services, Type }) => Type === PLAN && Services & service);
};

export const getPlans = ({ Plans = [] }: Subscription) => Plans.filter(({ Type }) => Type === PLAN);
export const getAddons = ({ Plans = [] }: Subscription) => Plans.filter(({ Type }) => Type === ADDON);
export const hasAddons = ({ Plans = [] }: Subscription) => Plans.some(({ Type }) => Type === ADDON);

export const getPlanName = (subscription: Subscription, service: PLAN_SERVICES = MAIL) => {
    const plan = getPlan(subscription, service);
    return plan?.Name;
};

export const isBundleEligible = (subscription: Subscription) => {
    const { Plans = [], CouponCode = '' } = subscription;

    if (CouponCode) {
        return false;
    }

    if (!Plans.length) {
        return true;
    }

    const plans = getPlans(subscription);

    if (plans.length > 1) {
        return false;
    }

    const [{ Name }] = plans;

    return [PLUS, VPNPLUS].includes(Name as PLANS);
};

export const hasLifetime = (subscription: Subscription) => {
    const { CouponCode = '' } = subscription;
    return CouponCode === 'LIFETIME';
};

export const hasVisionary = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VISIONARY);
};

export const hasMailPlus = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === PLUS);
};

export const hasMailProfessional = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === PROFESSIONAL);
};

export const hasVpnBasic = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VPNBASIC);
};

export const hasVpnPlus = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VPNPLUS);
};

export const getMonthlyBaseAmount = (name: PLANS, plans: Plan[], subscription: Subscription) => {
    const base = plans.find(({ Name }) => Name === name);
    if (!base) {
        return 0;
    }
    return subscription.Plans.filter(({ Name }) => Name === name).reduce((acc) => acc + base.Pricing[CYCLE.MONTHLY], 0);
};

export const getPlanIDs = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.reduce<PlanIDs>((acc, { ID, Quantity }) => {
        acc[ID] = acc[ID] || 0;
        acc[ID] += Quantity;
        return acc;
    }, {});
};
