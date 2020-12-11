import blackFridayOffers from '../helpers/blackFridayOffers';
import { getPlansMap } from '../../../helpers/paymentHelper';
import { isDealEvent, isProductPayerPeriod as productPayerPeriod } from '../helpers/blackFridayHelper';

/* @ngInject */
function blackFridayModel(dispatchers, subscriptionModel, paymentModel, PaymentCache, Feature, userType) {
    let allowed = false;
    const FEATURE_ID = userType().isFree ? 'BlackFridayPromoShown' : 'BundlePromoShown';
    const { on } = dispatchers();

    const saveClose = async () => {
        await Feature.updateValue(FEATURE_ID, true, { noNotify: true });
    };

    const getCloseState = async () => {
        const { Feature: feature } = await Feature.get(FEATURE_ID, { noNotify: true });
        const { Value, DefaultValue } = feature;
        return typeof Value === 'undefined' ? DefaultValue : Value;
    };

    /**
     * Check if we can trigger the BF.
     *     - Must be FREE
     *     - Must be a new free user or one without any subscriptions in the past (ex: not a free post downgrade)
     *     - Must be between START-END
     * @return {Boolean}
     */
    const isBlackFridayPeriod = () => {
        return allowed && isDealEvent() && userType().isFree && !userType().isDelinquent;
    };

    const isProductPayerPeriod = () => {
        return productPayerPeriod() && !userType().isDelinquent && subscriptionModel.isProductPayer();
    };

    /**
     * Get the black friday offers.
     * Gets it based on the current subscription.
     * Returns the offers, with the payment info from the API together with the plans.
     * @param {String} currency
     * @returns {Promise}
     */
    const getOffers = async (currency) => {
        const Plans = await PaymentCache.plans();
        const plansMap = getPlansMap(Plans);
        const isPayer = subscriptionModel.isProductPayer();

        const offers = blackFridayOffers(currency, isPayer).map(({ plans, ...offer }) => {
            const { PlanIDs, planList } = plans.reduce(
                (acc, name) => {
                    acc.PlanIDs.push(plansMap[name].ID);
                    acc.planList.push(plansMap[name]);
                    return acc;
                },
                { PlanIDs: [], planList: [] }
            );

            return {
                Currency: currency,
                PlanIDs,
                planList,
                ...offer
            };
        });

        const load = async ({ planList, mostPopular, CouponCode, PlanIDs, Cycle, Currency }) => {
            const [withCoupon, withoutCoupon, withoutCouponMonthly] = await Promise.all([
                PaymentCache.valid({ CouponCode, PlanIDs, Cycle, Currency }),
                PaymentCache.valid({ PlanIDs, Cycle, Currency }),
                PaymentCache.valid({ PlanIDs, Cycle: 1, Currency })
            ]);

            return {
                offer: withCoupon,
                mostPopular,
                Cycle,
                Currency: withCoupon.Currency,
                planList,
                withCoupon: withCoupon.Amount + withCoupon.CouponDiscount,
                withoutCoupon: withoutCoupon.Amount + withoutCoupon.CouponDiscount, // BUNDLE discount can be applied
                withoutCouponMonthly: withoutCouponMonthly.Amount
            };
        };

        return Promise.all(offers.map(load));
    };

    function loadPayments() {
        return Promise.all([paymentModel.getMethods(), paymentModel.getStatus()]);
    }

    function allow() {
        allowed = true;
    }

    on('logout', () => {
        allowed = false;
    });

    return { isBlackFridayPeriod, isProductPayerPeriod, loadPayments, getOffers, saveClose, getCloseState, allow };
}

export default blackFridayModel;
