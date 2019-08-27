import { PLAN_TYPES, PLAN_SERVICES } from '../constants';

const { PLAN } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;

/**
 * Get plan from current subscription
 * @param {Array} subscription.Plans
 * @param {Integer} service
 * @returns {Object}
 */
export const getPlan = ({ Plans = [] } = {}, service = MAIL) => {
    return Plans.find(({ Services, Type }) => Type === PLAN && Services & service) || {};
};

/**
 *
 * @param {Object} subscription
 * @param {Integer} service
 * @returns {String} plan name
 */
export const getPlanName = (subscription = {}, service = MAIL) => {
    const { Name = 'free' } = getPlan(subscription, service);
    return Name;
};
