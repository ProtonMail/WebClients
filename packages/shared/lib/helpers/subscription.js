import { PLAN_TYPES, PLAN_SERVICES, PLANS, CYCLE, ADDON_NAMES } from '../constants';
import { toMap } from './object';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS, VPNBASIC, VISIONARY } = PLANS;

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
    const plansMap = toMap(plans, 'Name');

    if (planID === plansMap[PLANS.VISIONARY].ID) {
        return { [plansMap[PLANS.VISIONARY].ID]: 1 };
    }

    const { UsedDomains = 0, UsedAddresses = 0, UsedSpace = 0, UsedVPN = 0, UsedMembers = 0 } = organization;
    const selectedPlan = plans.find(({ ID }) => ID === planID);

    return {
        ...removeService(planIDs, plans, service),
        [plansMap[ADDON_NAMES.DOMAIN].ID]: [plansMap[PLANS.PLUS].ID, plansMap[PLANS.PROFESSIONAL].ID].includes(planID)
            ? getAddonQuantity(selectedPlan, UsedDomains, 'MaxDomains', plansMap[ADDON_NAMES.DOMAIN])
            : 0,
        [plansMap[ADDON_NAMES.ADDRESS].ID]: [plansMap[PLANS.PLUS].ID].includes(planID)
            ? getAddonQuantity(selectedPlan, UsedAddresses, 'MaxAddresses', plansMap[ADDON_NAMES.ADDRESS])
            : 0,
        [plansMap[ADDON_NAMES.SPACE].ID]: [plansMap[PLANS.PLUS].ID].includes(planID)
            ? getAddonQuantity(selectedPlan, UsedSpace, 'MaxSpace', plansMap[ADDON_NAMES.SPACE])
            : 0,
        [plansMap[ADDON_NAMES.VPN].ID]:
            [plansMap[PLANS.VPNPLUS].ID].includes(planID) && planIDs[plansMap[PLANS.PROFESSIONAL].ID]
                ? getAddonQuantity(selectedPlan, UsedVPN, 'MaxVPN', plansMap[ADDON_NAMES.VPN])
                : 0,
        [plansMap[ADDON_NAMES.MEMBER].ID]: [plansMap[PLANS.PROFESSIONAL].ID].includes(planID)
            ? Math.max(
                  getAddonQuantity(selectedPlan, UsedMembers, 'MaxMembers', plansMap[ADDON_NAMES.MEMBER]),
                  getAddonQuantity(selectedPlan, UsedAddresses, 'MaxAddresses', plansMap[ADDON_NAMES.MEMBER]),
                  getAddonQuantity(selectedPlan, UsedSpace, 'MaxSpace', plansMap[ADDON_NAMES.MEMBER])
              )
            : 0,
        ...(planID ? { [planID]: 1 } : {})
    };
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
