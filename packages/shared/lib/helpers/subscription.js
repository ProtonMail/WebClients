import { PLAN_TYPES, PLAN_SERVICES, PLANS } from '../constants';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS } = PLANS;

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
