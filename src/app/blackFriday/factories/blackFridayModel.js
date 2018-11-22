import blackFridayOffers from '../helpers/blackFridayOffers';
import { isDealEvent } from '../helpers/blackFridayHelper';
import { BLACK_FRIDAY, CYCLE } from '../../constants';
import { getPlansMap } from '../../../helpers/paymentHelper';
import { getItem, setItem } from '../../../helpers/storageHelper';

/* @ngInject */
function blackFridayModel(authentication, subscriptionModel, paymentModel, PaymentCache) {
    // Needed as function because the authentiation.user.ID can change.
    const getKey = () => `protonmail_black_friday_${authentication.user.ID}_${BLACK_FRIDAY.YEAR}`;

    const hasSeenOffer = () => {
        return getItem(getKey(), false);
    };

    const saveClose = () => {
        setItem(getKey(), 'closed');
    };

    /**
     * Check if we are in the Black Friday period, and if there are any offers available.
     * @param {boolean} force
     * @returns {boolean}
     */
    const isDealPeriod = (force = false) => {
        if (!blackFridayOffers(subscriptionModel.get(), authentication.user).length) {
            return false;
        }
        if (!force && hasSeenOffer()) {
            return false;
        }
        return isDealEvent();
    };

    /**
     * Get all needed payment info for an offer.
     * @param {Object} subscription
     * @param {Object} plansMap
     * @param {String} currency
     * @returns {function}
     */
    const getOfferPayment = (subscription, plansMap, currency) => ({ offers = [], coupon, cycle }) => {
        const { PlanIDs, plans } = offers.reduce(
            (acc, { name, quantity = 1 }) => {
                const plan = plansMap[name];
                const { ID } = plan;

                acc.PlanIDs[ID] = quantity;
                acc.plans.push(plan);

                return acc;
            },
            { PlanIDs: {}, plans: [] }
        );

        // Use the YEARLY cycle for 2-for-1 deal and current subscription cycle or MONTHLY cycle for 2-year deal.
        const regularPriceCycle =
            coupon === BLACK_FRIDAY.COUPON_CODE ? CYCLE.YEARLY : subscription.Cycle || CYCLE.MONTHLY;

        return Promise.all([
            // Offer price
            PaymentCache.valid({
                PlanIDs,
                Currency: currency,
                Cycle: cycle,
                CouponCode: coupon
            }),
            // Regular price
            PaymentCache.valid({
                PlanIDs,
                Currency: currency,
                Cycle: regularPriceCycle
            }),
            // Without coupon to get the "after" price
            PaymentCache.valid({
                PlanIDs,
                Currency: currency,
                Cycle: BLACK_FRIDAY.CYCLE
            })
        ]).then((payments) => ({ PlanIDs, payments, plans }));
    };

    /**
     * Get the black friday offers.
     * Gets it based on the current subscription.
     * Returns the offers, with the payment info from the API together with the plans.
     * @param {String} currency
     * @returns {Promise}
     */
    const getOffers = async (currency) => {
        const subscription = subscriptionModel.get();
        const offers = blackFridayOffers(subscription, authentication.user);
        if (!offers.length) {
            return;
        }

        const Plans = await PaymentCache.plans();
        const plansMap = getPlansMap(Plans);
        // Either use the specified currency, or if there is none, use the currency of the first plan received from the API.
        const getOfferCb = getOfferPayment(subscription, plansMap, currency || plansMap.free.currency);

        return Promise.all(offers.map(getOfferCb));
    };

    function loadPayments() {
        return Promise.all([paymentModel.getMethods(), paymentModel.getStatus()]);
    }

    return { isDealPeriod, loadPayments, getOffers, saveClose };
}

export default blackFridayModel;
