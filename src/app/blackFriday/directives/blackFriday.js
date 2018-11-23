import { BLACK_FRIDAY, CYBER_MONDAY, PLANS_TYPE } from '../../constants';
import { getEventName, isBlackFriday } from '../helpers/blackFridayHelper';
import { getAfterCouponDiscount, hasBlackFridayCoupon, normalizePrice } from '../../../helpers/paymentHelper';

/* @ngInject */
function blackFriday(
    dispatchers,
    subscriptionModel,
    blackFridayModel,
    paymentModal,
    PaymentCache,
    networkActivityTracker,
    $filter
) {
    const TEXTS = {
        241: 'Two-for-one deal',
        2: 'Two-year deal',
        price: (price) => `${price} for the first 2 years`,
        regularPrice: (price) => `regular price ${price}`,
        currentPrice: (price, plans) => `You are currently charged ${price}/month for ${plans}`,
        savings: (price) => `Save ${price} over two years`,
        billing: (price) => `Billed as ${price} for two years`,
        afterBilling: (price) =>
            `Minus any prorated refund for remaining funds allocated to a current plan. After two years, your subscription automatically renews at the price of ${price} every two years.`,
        header(total) {
            const name = getEventName();
            return total === 1 ? `${name} deal` : `${name} deals`;
        },
        and: ' and ',
        commit2: 'Save more with a two year plan!',
        get2: 'Get two years for the price of one!',
        perMonth: '/mo',
        buy: 'Get the deal'
    };

    const currencyFilter = (amount, cycle, currency) => $filter('currency')(amount / 100 / cycle, currency);

    const percentageFilter = $filter('percentage');

    /**
     * Get the plan titles. Ignoring addons.
     * @param {Array} Plans
     * @returns {Array<String>}
     */
    const getPlanTitles = (Plans = []) =>
        Plans.filter(({ Type }) => Type === PLANS_TYPE.PLAN).map(({ Title }) => Title);

    /**
     * Get the price data for an offer.
     * @param {Object} discount
     * @param {Object} regular
     * @param {Object} after
     * @param {Number} index
     * @returns {Object}
     */
    const getPrice = ({ discount, regular, after, index }) => {
        const stars = '*'.repeat(index + 1);
        const { Cycle, Currency } = discount;

        const isBlackFridayDeal = hasBlackFridayCoupon(discount);

        const discountedAmount = getAfterCouponDiscount(discount);
        // Don't include the bundle discount when it's the black friday deal for the regular price
        const regularAmount = isBlackFridayDeal ? regular.Amount : getAfterCouponDiscount(regular);
        const regularNormalizedAmount = normalizePrice(regularAmount, regular.Cycle, Cycle);
        const savingsAmount = regularNormalizedAmount - discountedAmount;
        const afterAmount = getAfterCouponDiscount(after);

        return {
            header: TEXTS[isBlackFridayDeal ? 241 : 2],
            percentage: percentageFilter((regularNormalizedAmount - discountedAmount) / regularNormalizedAmount),
            discountedPrice: currencyFilter(discountedAmount, Cycle, Currency),
            regularPrice: TEXTS.regularPrice(currencyFilter(regularAmount, regular.Cycle, Currency)),
            savings: TEXTS.savings(currencyFilter(savingsAmount, 1, Currency)),
            billing: TEXTS.billing(currencyFilter(discountedAmount, 1, Currency)) + stars,
            afterBilling: stars + TEXTS.afterBilling(currencyFilter(afterAmount, 1, Currency))
        };
    };

    const getClickData = (PlanIDs, valid) => {
        return {
            payment: valid,
            PlanIDs
        };
    };

    const getOffer = ({ PlanIDs, plans = [], payments: [discount, regular, after] }, i) => ({
        ...getPrice({
            discount,
            regular,
            after,
            index: i
        }),
        plans: getPlanTitles(plans),
        clickData: getClickData(PlanIDs, discount)
    });

    const getCurrentPrice = ({ Amount, Cycle, Currency, Plans = [] }) => {
        if (!Amount) {
            return;
        }
        const planNames = getPlanTitles(Plans).join(TEXTS.and);
        return TEXTS.currentPrice(currencyFilter(Amount, Cycle, Currency), planNames);
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/blackFriday/blackFriday.tpl.html'),
        link(scope, element) {
            const { dispatcher, on, unsubscribe } = dispatchers(['closeDropdown', 'blackFriday']);

            const setLoading = (value) => scope.$applyAsync(() => (scope.state.loading = value));

            const wrapLoading = (promise) => {
                setLoading(true);
                return promise
                    .then((result) => {
                        setLoading(false);
                        return result;
                    })
                    .catch((e) => {
                        setLoading(false);
                        return Promise.reject(e);
                    });
            };

            /**
             * Opens up the payment to buy an offer.
             * @returns {Promise}
             */
            const openPayment = async ({ payment, PlanIDs }) => {
                if (scope.state.loading) {
                    return;
                }

                // Get with monthly cycle to ensure caching for paymentPlanOverview. Only needed for IDs.
                const promise = wrapLoading(PaymentCache.plans());
                const plans = await networkActivityTracker.track(promise);

                paymentModal.activate({
                    params: {
                        isBlackFriday: true,
                        planIDs: PlanIDs,
                        valid: payment,
                        plans,
                        cancel() {
                            paymentModal.deactivate();
                        }
                    }
                });
            };

            const onClick = ({ target }) => {
                const buyOffer = target.dataset.buyOffer;
                const offer = scope.offers[buyOffer];
                if (!offer) {
                    return;
                }

                openPayment(offer.clickData);
                dispatcher.blackFriday('closeModal');
            };

            const refresh = (currency) =>
                wrapLoading(blackFridayModel.getOffers(currency)).then((offers = []) => {
                    scope.$applyAsync(() => {
                        scope.state.header = TEXTS.header(offers.length);
                        scope.state.intro =
                            TEXTS[
                                offers.some(({ payments: [discount] }) => !hasBlackFridayCoupon(discount))
                                    ? 'commit2'
                                    : 'get2'
                            ];
                        scope.offers = offers.map(getOffer);
                    });
                });

            scope.state = {
                loading: true,
                currency: subscriptionModel.currency(),
                perMonth: TEXTS.perMonth,
                buy: TEXTS.buy,
                end: isBlackFriday() ? BLACK_FRIDAY.BETWEEN.END : CYBER_MONDAY.BETWEEN.END
            };

            scope.currentPrice = getCurrentPrice(subscriptionModel.get());

            networkActivityTracker.track(
                blackFridayModel.loadPayments().then(() => {
                    return refresh(scope.state.currency);
                })
            );

            element.on('click', onClick);

            on('blackFridayCurrency', (event, { type, data }) => {
                if (type === 'change') {
                    scope.state.currency = data;
                    networkActivityTracker.track(refresh(scope.state.currency));
                }
            });

            scope.$on('destroy', () => {
                element.off('click', onClick);
                unsubscribe();
            });
        }
    };
}

export default blackFriday;
