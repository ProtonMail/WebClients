import blackFridayOffers from '../helpers/blackFridayOffers';
import { BLACK_FRIDAY } from '../../constants';
import { getPlansMap } from '../../../helpers/paymentHelper';
import { setItem } from '../../../helpers/storageHelper';
import { isDealEvent } from '../helpers/blackFridayHelper';

/* @ngInject */
function blackFridayModel(authentication, subscriptionModel, paymentModel, PaymentCache, userType) {
    let allowed = false;
    // Needed as function because the authentiation.user.ID can change.
    const getKey = () => `protonmail_black_friday_${authentication.user.ID}_${BLACK_FRIDAY.YEAR}`;

    const saveClose = () => {
        setItem(getKey(), 'closed');
    };

    /**
     * Check if we can trigger the BF.
     *     - Must be FREE
     *     - Must be a new free user or one without any subscriptions in the past (ex: not a free post downgrade)
     *     - Must be between START-END
     * @return {Boolean}
     */
    const isDealPeriod = () => {
        const isAvailable = userType().isFree && allowed && isDealEvent();
        return isAvailable || (subscriptionModel.isPlusForBF2019() && isDealEvent());
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
        const isPlus = subscriptionModel.isPlusForBF2019();

        const offers = blackFridayOffers(currency, isPlus).map(({ plans, ...offer }) => {
            const { PlanIDs, planList } = plans.reduce(
                (acc, name) => {
                    acc.PlanIDs.push(plansMap[name].ID);
                    acc.planList.push(plansMap[name]);
                    return acc;
                },
                { PlanIDs: [], planList: [] }
            );

            return {
                PlanIDs,
                planList,
                ...offer
            };
        });

        const load = ({ planList, ...config }) => {
            return PaymentCache.valid(config).then((offer) => ({ offer, config: { planList, ...config } }));
        };
        return Promise.all(offers.map(load));
    };

    function loadPayments() {
        return Promise.all([paymentModel.getMethods(), paymentModel.getStatus()]);
    }

    function allow() {
        allowed = true;
    }

    return { isDealPeriod, loadPayments, getOffers, saveClose, allow };
}

export default blackFridayModel;
