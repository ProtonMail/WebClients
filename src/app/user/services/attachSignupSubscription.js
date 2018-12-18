/* @ngInject */
function attachSignupSubscription(authentication, Payment) {
    /**
     * Subscribe to the plans chosen at signup.
     * @param {Object} planIds
     * @param {Object} payment
     * @return {Promise}
     */
    const processPlans = (planIds, payment = {}) => {
        // No plan ids means the user did not try to sign up with any plans.
        if (!planIds) {
            return;
        }

        const { Currency, Cycle, Coupon } = payment;
        // Coupon can be null from the API.
        const { Code } = Coupon || {};

        return Payment.subscribe({
            Amount: 0,
            Currency,
            Cycle,
            CouponCode: Code,
            PlanIDs: planIds
        });
    };

    /**
     * Attach the credit card used at signup as a payment method.
     * @param {Object} method
     * @returns {Promise|*}
     */
    const processPaymentMethod = (method = {}) => {
        if (method.Type === 'card') {
            return Payment.updateMethod(method, { noNotify: true }).catch(() => {
                /**
                 * Silently catch any errors when attaching the payment method.
                 * This is because you can sign up for a paid plan and have the final
                 * amount be 0 due to gift codes and coupons.
                 * In that case we don't know if the user entered the credit card details correctly.
                 * So attempt to save it if he did, but if he didn't don't error out.
                 */
            });
        }
    };

    return ({ planIds, payment, method }) =>
        Promise.all([processPlans(planIds, payment), processPaymentMethod(method)]);
}
export default attachSignupSubscription;
