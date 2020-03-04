import { PLAN_TYPES, PLAN_SERVICES, PLANS, CYCLE, ADDON_NAMES, MAX_DOMAIN_PLUS_ADDON } from '../constants';
import { toMap, omit } from './object';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS, VPNBASIC, VISIONARY, PROFESSIONAL } = PLANS;
const { VPN, SPACE, MEMBER, ADDRESS, DOMAIN } = ADDON_NAMES;

/**
 * Get plan from current subscription
 * @param {Array} subscription.Plans
 * @param {Integer} service
 * @returns {Object} plan
 */
export const getPlan = ({ Plans = [] } = {}, service = MAIL) => {
    return Plans.find(({ Services, Type }) => Type === PLAN && Services & service) || {};
};

export const getPlans = ({ Plans = [] } = {}) => Plans.filter(({ Type }) => Type === PLAN);
export const getAddons = ({ Plans = [] } = {}) => Plans.filter(({ Type }) => Type === ADDON);

/**
 *
 * @param {Object} subscription
 * @param {Integer} service
 * @returns {String} plan name
 */
export const getPlanName = (subscription = {}, service = MAIL) => {
    const { Name = '' } = getPlan(subscription, service);
    return Name;
};

/**
 * Check if a subscription is eligible to BUNDLE coupon
 * @param {Object} subscription
 * @returns {Boolean} is eligible to BUNDLE
 */
export const isBundleEligible = (subscription = {}) => {
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

    const [{ Name = '' }] = plans;

    return [PLUS, VPNPLUS].includes(Name);
};

export const hasLifetime = (subscription = {}) => {
    const { CouponCode = '' } = subscription;
    return CouponCode === 'LIFETIME';
};

/**
 * Check if the current subscription has visionary plan
 * @param {Object} subscription
 * @returns {Boolean}
 */
export const hasVisionary = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VISIONARY);
};

export const hasMailPlus = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === PLUS);
};

export const hasVpnBasic = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VPNBASIC);
};

/**
 *
 * @param {String} name plan or addon name
 * @param {Array} plans coming for Plans API
 * @param {Object} subscription
 * @returns {Number} price
 */
export const getMonthlyBaseAmount = (name = '', plans = [], subscription = {}) => {
    const base = plans.find(({ Name }) => Name === name);
    return subscription.Plans.filter(({ Name }) => Name === name).reduce((acc) => acc + base.Pricing[CYCLE.MONTHLY], 0);
};

/**
 * Calculate total from planIDs configuration
 * @param {Array<Object>} params.plans
 * @param {Object} params.planIDs
 * @param {Number} params.cycle
 * @param {Number} params.service
 * @returns {Number} total
 */
export const getTotal = ({ plans = [], planIDs = {}, cycle = CYCLE.MONTHLY, service }) => {
    const plansMap = toMap(plans);
    return Object.entries(planIDs).reduce((acc, [planID = '', quantity = 0]) => {
        const { Pricing = {}, Services } = plansMap[planID];

        if (Number.isInteger(service) && !hasBit(Services, service)) {
            return acc;
        }

        return acc + Pricing[cycle] * quantity;
    }, 0);
};

/**
 * Remove all plans concerned by a service
 * @param {Object} planIDs
 * @param {Array} plans
 * @param {Integer} service
 * @returns {Object} new planIDs
 */
export const removeService = (planIDs = {}, plans = [], service = PLAN_SERVICES.MAIL) => {
    const plansMap = toMap(plans);
    return Object.entries(planIDs).reduce((acc, [planID = '', quantity = 0]) => {
        const { Services } = plansMap[planID];

        if (!hasBit(Services, service)) {
            acc[planID] = quantity;
        }

        return acc;
    }, {});
};

const getAddonQuantity = (plan = {}, used = 0, key = '', addon = {}) => {
    if (used <= plan[key]) {
        return 0;
    }

    return Math.ceil((used - plan[key]) / addon[key]);
};

/**
 * Generate new configuration from plan selected
 * @param {Object} planIDs current configuration
 * @param {Array} plans coming from the API
 * @param {String} planID to switch to
 * @param {Integer} service to remove
 * @param {Object} organization current
 * @returns {Object} new planIDs
 */
export const switchPlan = ({ planIDs, plans, planID, service, organization }) => {
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

    const transferDomains = (from, to) => {
        const domains = plansMap[from].MaxDomains - plansMap[to].MaxDomains + (planIDs[plansMap[DOMAIN].ID] || 0);
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
                plansMap[MEMBER].ID
            ]),
            [plansMap[DOMAIN].ID]:
                transferDomains(PROFESSIONAL, PLUS) ||
                getAddonQuantity(selectedPlan, UsedDomains, 'MaxDomains', plansMap[DOMAIN]) ||
                0,
            [plansMap[ADDRESS].ID]:
                getAddonQuantity(selectedPlan, UsedAddresses, 'MaxAddresses', plansMap[ADDRESS]) || 0,
            [plansMap[SPACE].ID]: getAddonQuantity(selectedPlan, UsedSpace, 'MaxSpace', plansMap[SPACE]) || 0,
            [planID]: 1
        };
    }

    if (plansMap[PROFESSIONAL].ID === planID) {
        return {
            ...omit(planIDs, [
                plansMap[PLUS].ID,
                plansMap[PROFESSIONAL].ID,
                plansMap[VISIONARY].ID,
                plansMap[ADDRESS].ID,
                plansMap[SPACE].ID
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
            [planID]: 1
        };
    }

    if (plansMap[VPNBASIC].ID === planID) {
        return {
            ...omit(planIDs, [plansMap[VPNBASIC].ID, plansMap[VPNPLUS].ID, plansMap[VISIONARY].ID, plansMap[VPN].ID]),
            [planID]: 1
        };
    }

    if (plansMap[VPNPLUS].ID === planID) {
        return {
            ...omit(planIDs, [plansMap[VPNBASIC].ID, plansMap[VPNPLUS].ID, plansMap[VISIONARY].ID]),
            [plansMap[VPN].ID]: planIDs[plansMap[PROFESSIONAL].ID]
                ? getAddonQuantity(selectedPlan, UsedVPN, 'MaxVPN', plansMap[VPN])
                : 0,
            [planID]: 1
        };
    }

    return {};
};

export const getPlanIDs = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.reduce((acc, { ID, Quantity }) => {
        acc[ID] = acc[ID] || 0;
        acc[ID] += Quantity;
        return acc;
    }, {});
};

export const clearPlanIDs = (planIDs = {}) => {
    return Object.entries(planIDs).reduce((acc, [planID, quantity]) => {
        if (!quantity) {
            return acc;
        }
        acc[planID] = quantity;
        return acc;
    }, {});
};
