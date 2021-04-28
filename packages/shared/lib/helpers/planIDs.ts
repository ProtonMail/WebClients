import { Plan, PlanIDs, MaxKeys, Organization } from '../interfaces';
import { PLAN_SERVICES, PLANS, CYCLE, MAX_DOMAIN_PLUS_ADDON, ADDON_NAMES } from '../constants';

import { hasBit } from './bitset';
import { toMap, omit } from './object';

const { PLUS, VPNPLUS, VPNBASIC, VISIONARY, PROFESSIONAL } = PLANS;
const { VPN, SPACE, MEMBER, ADDRESS, DOMAIN } = ADDON_NAMES;

export const hasPlanIDs = (planIDs: PlanIDs) => Object.values(planIDs).some((quantity) => quantity > 0);

export const clearPlanIDs = (planIDs: PlanIDs) => {
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planID, quantity = 0]) => {
        if (quantity <= 0) {
            return acc;
        }
        acc[planID] = quantity;
        return acc;
    }, {});
};

export const removeService = (planIDs: PlanIDs, plans: Plan[], service: PLAN_SERVICES = PLAN_SERVICES.MAIL) => {
    const plansMap = toMap(plans);
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planID = '', quantity = 0]) => {
        const { Services } = plansMap[planID];

        if (hasBit(Services, service)) {
            return acc;
        }

        acc[planID] = quantity;
        return acc;
    }, {});
};

export const getHasPlanType = (planIDs: PlanIDs, plans: Plan[], planType: PLANS) => {
    const plan = plans.find(({ Name }) => Name === planType);
    return plan?.ID ? planIDs[plan.ID] >= 1 : false;
};

const getAddonQuantity = (plan: Plan | undefined, used = 0, key: MaxKeys, addon: Plan) => {
    const planKey = plan?.[key] || 0;

    if (!plan) {
        return 0;
    }

    if (used <= planKey) {
        return 0;
    }

    if (!addon) {
        return 0;
    }

    const addonKey = addon[key] || 0;
    return Math.ceil((used - planKey) / addonKey);
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
    planID: string | undefined;
    service: PLAN_SERVICES;
    organization?: Organization;
}) => {
    // Handle FREE VPN and FREE Mail
    if (planID === undefined) {
        return removeService(planIDs, plans, service);
    }

    const plansMap = toMap(plans, 'Name');

    if (planID === plansMap[VISIONARY].ID) {
        return { [plansMap[VISIONARY].ID]: 1 };
    }

    const { UsedDomains = 0, UsedAddresses = 0, UsedSpace = 0, UsedVPN = 0, UsedMembers = 0 } = organization || {};
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
        return clearPlanIDs({
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
        });
    }

    if (plansMap[PROFESSIONAL].ID === planID) {
        const vpnAddons = getAddonQuantity(selectedPlan, UsedVPN, 'MaxVPN', plansMap[VPN]) || 0;

        return clearPlanIDs({
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
            ...(!planIDs[plansMap[VPNBASIC].ID]
                ? {
                      [plansMap[VPNPLUS].ID]: vpnAddons || planIDs[plansMap[VPNPLUS].ID] ? 1 : 0,
                      [plansMap[VPN].ID]: vpnAddons ? vpnAddons - plansMap[VPNPLUS].MaxVPN : 0,
                  }
                : undefined),
            [planID]: 1,
        });
    }

    if (plansMap[VPNBASIC].ID === planID) {
        return clearPlanIDs({
            ...omit(planIDs, [plansMap[VPNBASIC].ID, plansMap[VPNPLUS].ID, plansMap[VISIONARY].ID, plansMap[VPN].ID]),
            [planID]: 1,
        });
    }

    if (plansMap[VPNPLUS].ID === planID) {
        return clearPlanIDs({
            ...omit(planIDs, [plansMap[VPNBASIC].ID, plansMap[VPNPLUS].ID, plansMap[VISIONARY].ID]),
            [plansMap[VPN].ID]: planIDs[plansMap[PROFESSIONAL].ID]
                ? getAddonQuantity(selectedPlan, UsedVPN, 'MaxVPN', plansMap[VPN])
                : 0,
            [planID]: 1,
        });
    }

    return {};
};

export const setQuantity = (planIDs: PlanIDs, planID: string, newQuantity: number) => {
    const { [planID]: removedPlan, ...restPlanIDs } = planIDs;
    if (!newQuantity || newQuantity <= 0) {
        return restPlanIDs;
    }
    return {
        ...restPlanIDs,
        [planID]: newQuantity,
    };
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

export const getSupportedAddons = (planIDs: PlanIDs, plans: Plan[]) => {
    const plansMap = toMap(plans, 'Name');
    const supported: Partial<Record<ADDON_NAMES, boolean>> = {};

    if (planIDs[plansMap[PLANS.PLUS].ID]) {
        supported[ADDON_NAMES.SPACE] = true;
        supported[ADDON_NAMES.ADDRESS] = true;
        supported[ADDON_NAMES.DOMAIN] = true;
    }

    if (planIDs[plansMap[PLANS.PROFESSIONAL].ID]) {
        supported[ADDON_NAMES.MEMBER] = true;
        supported[ADDON_NAMES.DOMAIN] = true;
    }

    if (planIDs[plansMap[PLANS.PROFESSIONAL].ID] && planIDs[plansMap[PLANS.VPNPLUS].ID]) {
        supported[ADDON_NAMES.VPN] = true;
    }

    return supported;
};
