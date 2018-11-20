/**
 * Normalize an amount to another cycle.
 * @param {Number} amount - The amount
 * @param {Number} currentCycle - The cycle of the current price.
 * @param {Number} otherCycle - The cycle of the price to normalize to.
 * @returns {number}
 */
import { BLACK_FRIDAY } from '../app/constants';

/**
 * Normalize a price in cycle A to cycle B
 * E.g. 12/month (cycleA = 1)
 * to 144/year (cycleB = 12)
 * @param {Number} amountA
 * @param {Number} cycleA
 * @param {Number} cycleB
 * @returns {Number}
 */
export const normalizePrice = (amountA, cycleA, cycleB) => (cycleA === cycleB ? amountA : amountA * (cycleB / cycleA));

/**
 * Get plans as a map. Where each name of the plan is the key.
 * @param {Array} Plans
 * @param {String} key What key to map by.
 * @returns {Object}
 */
export const getPlansMap = (Plans = [], key = 'Name') => {
    return Plans.reduce((acc, plan) => {
        acc[plan[key]] = plan;
        return acc;
    }, {});
};

/**
 * Get the discounted coupon price. Does not use AmountDue because of credit and proration.
 * @param {Number} Amount
 * @param {Number} CouponDiscount
 * @returns {Number}
 */
export const getAfterCouponDiscount = ({ Amount, CouponDiscount }) => Amount + CouponDiscount;

/**
 * Check if a payment has the black friday coupon.
 * @param Coupon - Don't destructure it because it can be `null`
 * @returns {boolean}
 */
export const hasBlackFridayCoupon = ({ Coupon } = {}) => Coupon && Coupon.Code === BLACK_FRIDAY.COUPON_CODE;
