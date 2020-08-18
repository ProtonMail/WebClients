import { PLAN_TYPES, PLAN_SERVICES, PLANS, CYCLE, ADDON_NAMES, MAX_DOMAIN_PLUS_ADDON } from '../constants';
import { toMap, omit } from './object';
import { hasBit } from './bitset';
import { Subscription, Plan, PlanIDs, MaxKeys, Organization } from '../interfaces';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS, VPNBASIC, VISIONARY, PROFESSIONAL } = PLANS;
const { VPN, SPACE, MEMBER, ADDRESS, DOMAIN } = ADDON_NAMES;

export const getPlan = ({ Plans = [] }: Subscription, service: PLAN_SERVICES = MAIL) => {
    return Plans.find(({ Services, Type }) => Type === PLAN && Services & service);
};

export const getPlans = ({ Plans = [] }: Subscription) => Plans.filter(({ Type }) => Type === PLAN);
export const getAddons = ({ Plans = [] }: Subscription) => Plans.filter(({ Type }) => Type === ADDON);

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

export const hasVpnBasic = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VPNBASIC);
};

export const getMonthlyBaseAmount = (name: PLANS, plans: Plan[], subscription: Subscription) => {
    const base = plans.find(({ Name }) => Name === name);
    if (!base) {
        return 0;
    }
    return subscription.Plans.filter(({ Name }) => Name === name).reduce((acc) => acc + base.Pricing[CYCLE.MONTHLY], 0);
};

export const getTotal = ({
    plans = [],
    planIDs = {},
    cycle = CYCLE.MONTHLY,
    service,
}: {
    service: PLAN_SERVICES;
    cycle?: CYCLE;
    plans?: Plan[];
    planIDs?: PlanIDs;
}) => {
    const plansMap = toMap(plans);
    return Object.entries(planIDs).reduce((acc, [planID = '', quantity = 0]) => {
        const { Pricing, Services } = plansMap[planID];

        if (Number.isInteger(service) && !hasBit(Services, service)) {
            return acc;
        }

        return acc + Pricing[cycle] * quantity;
    }, 0);
};

export const removeService = (planIDs: PlanIDs, plans: Plan[], service: PLAN_SERVICES = PLAN_SERVICES.MAIL) => {
    const plansMap = toMap(plans);
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planID = '', quantity = 0]) => {
        const { Services } = plansMap[planID];

        if (!hasBit(Services, service)) {
            acc[planID] = quantity;
        }

        return acc;
    }, {});
};

const getAddonQuantity = (plan: Plan | undefined, used = 0, key: MaxKeys, addon: Plan) => {
    if (!plan) {
        return 0;
    }

    if (used <= plan[key]) {
        return 0;
    }

    if (!addon) {
        return 0;
    }

    return Math.ceil((used - plan[key]) / addon[key]);
};

export const switchPlan = ({
    planIDs,
    plans,
    planID,
    service,
    organization,
}: {
    planIDs: PlanIDs;
    plans: Plan[];
    planID: string;
    service: PLAN_SERVICES;
    organization: Organization;
}) => {
    // Handle FREE VPN and FREE Mail
    if (typeof planID === 'undefined') {
        return removeService(planIDs, plans, service);
    }

    const plansMap = toMap(plans, 'Name');

    if (planID === plansMap[VISIONARY].ID) {
        return { [plansMap[VISIONARY].ID]: 1 };
    }

    const { UsedDomains = 0, UsedAddresses = 0, UsedSpace = 0, UsedVPN = 0, UsedMembers = 0 } = organization;
    const selectedPlan = plans.find(({ ID }) => ID === planID);

    const transferDomains = (from: PLANS, to: PLANS) => {
        const domains = planIDs[plansMap[DOMAIN].ID]
            ? plansMap[from].MaxDomains - plansMap[to].MaxDomains + planIDs[plansMap[DOMAIN].ID]
            : 0;
        if (domains < 0) {
            return 0;
        }
        const plusLimit = MAX_DOMAIN_PLUS_ADDON - plansMap[PLUS].MaxDomains;
        if (domains > plusLimit) {
            return plusLimit;
        }
        return domains;
    };

    if (plansMap[PLUS].ID === planID) {
        return {
            ...omit(planIDs, [
                plansMap[PLUS].ID,
                plansMap[PROFESSIONAL].ID,
                plansMap[VISIONARY].ID,
                plansMap[MEMBER].ID,
            ]),
            [plansMap[DOMAIN].ID]:
                transferDomains(PROFESSIONAL, PLUS) ||
                getAddonQuantity(selectedPlan, UsedDomains, 'MaxDomains', plansMap[DOMAIN]) ||
                0,
            [plansMap[ADDRESS].ID]:
                getAddonQuantity(selectedPlan, UsedAddresses, 'MaxAddresses', plansMap[ADDRESS]) || 0,
            [plansMap[SPACE].ID]: getAddonQuantity(selectedPlan, UsedSpace, 'MaxSpace', plansMap[SPACE]) || 0,
            [planID]: 1,
        };
    }

    if (plansMap[PROFESSIONAL].ID === planID) {
        return {
            ...omit(planIDs, [
                plansMap[PLUS].ID,
                plansMap[PROFESSIONAL].ID,
                plansMap[VISIONARY].ID,
                plansMap[ADDRESS].ID,
                plansMap[SPACE].ID,
            ]),
            [plansMap[MEMBER].ID]:
                Math.max(
                    getAddonQuantity(selectedPlan, UsedMembers, 'MaxMembers', plansMap[MEMBER]),
                    getAddonQuantity(selectedPlan, UsedAddresses, 'MaxAddresses', plansMap[MEMBER]),
                    getAddonQuantity(selectedPlan, UsedSpace, 'MaxSpace', plansMap[MEMBER])
                ) || 0,
            [plansMap[DOMAIN].ID]:
                transferDomains(PLUS, PROFESSIONAL) ||
                getAddonQuantity(selectedPlan, UsedDomains, 'MaxDomains', plansMap[DOMAIN]) ||
                0,
            [planID]: 1,
        };
    }

    if (plansMap[VPNBASIC].ID === planID) {
        return {
            ...omit(planIDs, [plansMap[VPNBASIC].ID, plansMap[VPNPLUS].ID, plansMap[VISIONARY].ID, plansMap[VPN].ID]),
            [planID]: 1,
        };
    }

    if (plansMap[VPNPLUS].ID === planID) {
        return {
            ...omit(planIDs, [plansMap[VPNBASIC].ID, plansMap[VPNPLUS].ID, plansMap[VISIONARY].ID]),
            [plansMap[VPN].ID]: planIDs[plansMap[PROFESSIONAL].ID]
                ? getAddonQuantity(selectedPlan, UsedVPN, 'MaxVPN', plansMap[VPN])
                : 0,
            [planID]: 1,
        };
    }

    return {};
};

export const getPlanIDs = (subscription: Subscription) => {
    const { Plans = [] } = subscription;
    return Plans.reduce<PlanIDs>((acc, { ID, Quantity }) => {
        acc[ID] = acc[ID] || 0;
        acc[ID] += Quantity;
        return acc;
    }, {});
};

export const clearPlanIDs = (planIDs: PlanIDs) => {
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planID, quantity = 0]) => {
        if (quantity <= 0) {
            return acc;
        }
        acc[planID] = quantity;
        return acc;
    }, {});
};
