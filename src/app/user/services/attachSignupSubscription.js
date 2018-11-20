/* @ngInject */
function attachSignupSubscription(authentication, Payment) {
    const processPlans = (plans = [], payment = {}) => {
        const PlanIDs = plans.map(({ ID }) => ID);
        const { Currency, Cycle, Coupon } = payment;
        // Coupon can be null from the API.
        const { Code } = Coupon || {};

        // Only try to subscribe if user selected a plan.
        // The API will complain anyway if it does not work.
        if (!PlanIDs.length) {
            return;
        }

        return Payment.subscribe({
            Amount: 0,
            Currency,
            Cycle,
            CouponCode: Code,
            PlanIDs: PlanIDs.reduce((acc, cur) => {
                acc[cur] = 1;
                return acc;
            }, {})
        });
    };

    const processPaymentMethod = (method = {}) => {
        if (method.Type === 'card') {
            return Payment.updateMethod(method);
        }
    };

    return ({ plans, payment, method }) => Promise.all([processPlans(plans, payment), processPaymentMethod(method)]);
}
export default attachSignupSubscription;
