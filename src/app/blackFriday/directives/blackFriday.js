import { BLACK_FRIDAY, CYBER_MONDAY } from '../../constants';
import { isBlackFriday } from '../helpers/blackFridayHelper';
import { getAfterCouponDiscount } from '../../../helpers/paymentHelper';

/* @ngInject */
function blackFriday(
    dispatchers,
    subscriptionModel,
    blackFridayModel,
    paymentModal,
    PaymentCache,
    networkActivityTracker,
    $filter,
    gettextCatalog
) {
    const TEXTS = {
        2: 'Two-year deal',
        billing(price, cycle) {
            if (cycle === 12) {
                return gettextCatalog.getString('Billed as {{price}}', { price }, 'Info');
            }
            return gettextCatalog.getString('Billed as {{price}}', { price }, 'Info');
        },
        afterBilling(price, cycle, index) {
            if (cycle === 12) {
                return gettextCatalog.getString(
                    'Renews after 1 year at a discounted annual price of {{price}} per year (20% discount)',
                    { price },
                    'Info'
                );
            }
            const discount = index === 1 ? 33 : 47;
            return gettextCatalog.getString(
                'Renews after 2 years at a discounted 2-year price of {{price}} every 2 years ({{discount}}% discount)',
                { price, discount },
                'Info'
            );
        },
        perMonth: gettextCatalog.getString('/mo', null, 'price'),
        buy: gettextCatalog.getString('Get the deal', null, 'Action'),
        savings(price) {
            return gettextCatalog.getString('Save {{price}}', { price }, 'Info');
        },
        offer(plans, cycle) {
            if (cycle === 12) {
                return {
                    type: '1 year deal',
                    title: plans[0].Title
                };
            }

            if (plans.length === 1) {
                return {
                    type: '2 Year deal',
                    title: plans[0].Title
                };
            }

            return {
                type: '2 Years Bundle',
                title: plans.map(({ Title }) => Title).join(' + ')
            };
        }
    };

    const percentageFilter = $filter('percentage');
    const currencyFilter = (amount, cycle, currency) => $filter('currency')(amount / 100 / cycle, currency, true);

    const getClickData = (PlanIDs, valid) => {
        return {
            payment: valid,
            PlanIDs
        };
    };

    const getOffer = ({ offer, config: { PlanIDs, planList, Cycle } }, index) => {
        // Plans are all Cycle 1
        const priceRegular = planList.reduce((acc, { Amount, Cycle }) => acc + (Cycle === 1 ? Amount * 12 : Amount), 0);

        const priceOffer = getAfterCouponDiscount(offer);
        const price = {
            monthly: currencyFilter(priceOffer, offer.Cycle, offer.Currency),
            monthlyRegular: currencyFilter(priceRegular, 12, offer.Currency),
            total: currencyFilter(priceOffer, 1, offer.Currency),
            totalRegular: currencyFilter(priceRegular, 1, offer.Currency)
        };
        const delta = offer.Cycle === 12 ? 1 : 2;
        const val = priceRegular * delta;
        const percentage = percentageFilter((val - priceOffer) / val);
        const afterBillValue = planList.length === 2 ? 19040 : offer.Amount;
        const savingsPrice = ((24 * priceRegular) / 12 / 100) * percentage;
        return {
            offer,
            price,
            percentage,

            savings: TEXTS.savings(currencyFilter(savingsPrice, 1, offer.Currency)),
            afterBilling: TEXTS.afterBilling(currencyFilter(afterBillValue, 1, offer.Currency), offer.Cycle, index),
            clickData: getClickData(PlanIDs, offer),
            header: TEXTS.offer(planList, Cycle),
            billingTxt: TEXTS.billing(price.total, offer.Cycle)
        };
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
                        planIDs: PlanIDs.reduce((acc, id) => ((acc[id] = 1), acc), {}),
                        valid: payment,
                        plans
                    }
                });
            };

            const onClick = ({ target }) => {
                if (!scope.offers) {
                    return;
                }
                const buyOffer = target.dataset.buyOffer;
                const offer = scope.offers[buyOffer];
                if (!offer) {
                    return;
                }

                openPayment(offer.clickData);
                dispatcher.blackFriday('closeModal');
            };

            const refresh = async (currency) => {
                const offers = await wrapLoading(blackFridayModel.getOffers(currency));
                scope.$applyAsync(() => {
                    scope.offers = offers.map(getOffer);
                });
            };

            scope.state = {
                loading: true,
                currency: subscriptionModel.currency(),
                perMonth: TEXTS.perMonth,
                buy: TEXTS.buy,
                end: isBlackFriday() ? BLACK_FRIDAY.BETWEEN.END : CYBER_MONDAY.BETWEEN.END
            };

            scope.getPrice = ({ price: { monthly: priceMonthly = '' } = {} } = {}) => {
                if (priceMonthly.startsWith('$')) {
                    const [currency, main, ...rest] = priceMonthly.split('');
                    return `${currency}<span class="bf-main-price">${main}</span>${rest.join('')}${TEXTS.perMonth}`;
                }
                const [main, ...rest] = priceMonthly.split('');

                return `<span class="bf-main-price">${main}</span>${rest.join('')}${TEXTS.perMonth}`;
            };

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
