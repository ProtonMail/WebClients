import { PLANS_TYPE } from '../../constants';
import { isCyberMonday } from '../helpers/blackFridayHelper';

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
        billing(price, cycle) {
            if (cycle === 12) {
                return gettextCatalog.getString('Billed as {{price}} for 1 year', { price }, 'blackfriday Info');
            }
            return gettextCatalog.getString('Billed as {{price}} for 2 years', { price }, 'blackfriday Info');
        },
        afterBilling(price, cycle, plans) {
            if (cycle === 12 && plans.length === 1) {
                return gettextCatalog.getString(
                    'Renews after 1 year at a discounted annual price of {{price}} per year (20% discount).',
                    { price },
                    'blackfriday Info'
                );
            }
            if (cycle === 24) {
                return gettextCatalog.getString(
                    'Renews after 2 years at a discounted 2-year and bundle price of {{price}} every 2 years (47% discount).',
                    { price },
                    'blackfriday Info'
                );
            }
            return gettextCatalog.getString(
                'Renews after 1 year at a discounted annual and bundle price of {{price}} every year (36% discount).',
                { price },
                'blackfriday Info'
            );
        },
        perMonth: gettextCatalog.getString('per month', null, 'blackfriday price'),
        buy: gettextCatalog.getString('Get limited-time deal', null, 'blackfriday Action'),
        upgrade: gettextCatalog.getString('Upgrade', null, 'blackfriday Action'),
        offer(plans, cycle) {
            if (cycle === 12 && plans.length === 1) {
                return {
                    type: gettextCatalog.getString('for 1 year', null, 'blackfriday Info'),
                    title: plans[0].Title
                };
            }

            if (cycle === 24) {
                return {
                    type: gettextCatalog.getString('for 2 years', null, 'blackfriday Info'),
                    title: plans.map(({ Title }) => Title).join(' + ')
                };
            }

            return {
                type: gettextCatalog.getString('for 1 year', null, 'blackfriday Info'),
                title: plans.map(({ Title }) => Title).join(' + ')
            };
        }
    };

    const currencyFilter = (amount, cycle, currency) => $filter('currency')(amount / 100 / cycle, currency, true);

    const getClickData = (plans, payment) => {
        if (subscriptionModel.isProductPayer()) {
            return { payment, plans: plans.concat(subscriptionModel.getAddons()) };
        }

        return { payment, plans };
    };

    const getOffer = ({
        offer,
        withCoupon,
        withoutCoupon,
        withoutCouponMonthly,
        mostPopular,
        planList,
        Cycle,
        Currency
    }) => {
        const withCouponMonthly = withCoupon / Cycle;
        return {
            mostPopular,
            price: {
                monthly: currencyFilter(withCoupon, Cycle, Currency),
                monthlyRegular: currencyFilter(withoutCouponMonthly, 1, Currency),
                total: currencyFilter(withCoupon, 1, Currency),
                totalRegular: currencyFilter(withoutCouponMonthly * Cycle, 1, Currency)
            },
            percentage: 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly),
            driveIncluded: planList.length === 2,
            afterBilling: TEXTS.afterBilling(currencyFilter(withoutCoupon, 1, Currency), Cycle, planList),
            clickData: getClickData(planList, offer),
            header: TEXTS.offer(planList, Cycle),
            billingTxt: TEXTS.billing(currencyFilter(withCoupon, 1, Currency), Cycle)
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
            const openPayment = async ({ payment, plans: planList }) => {
                if (scope.state.loading) {
                    return;
                }

                const planIDs = planList.reduce((acc, { ID, Type }) => {
                    if (Type === PLANS_TYPE.PLAN) {
                        acc[ID] = 1;
                    }

                    if (Type === PLANS_TYPE.ADDON) {
                        acc[ID] = (acc[ID] || 0) + 1;
                    }
                    return acc;
                }, {});

                // Get with monthly cycle to ensure caching for paymentPlanOverview. Only needed for IDs.
                const promise = wrapLoading(PaymentCache.plans());
                const plans = await networkActivityTracker.track(promise);

                // we re-check again for plus as you might have addons
                if (subscriptionModel.isProductPayer()) {
                    const { Currency, Cycle } = payment;
                    const valid = await PaymentCache.valid({
                        Currency,
                        Cycle,
                        PlanIDs: planIDs
                    });
                    return paymentModal.activate({
                        params: {
                            isBlackFriday: true,
                            valid,
                            planIDs,
                            plans
                        }
                    });
                }

                paymentModal.activate({
                    params: {
                        isBlackFriday: true,
                        valid: payment,
                        planIDs,
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
                buy: subscriptionModel.isProductPayer() ? TEXTS.upgrade : TEXTS.buy,
                isCyberMonday: isCyberMonday(),
                isProductPayer: subscriptionModel.isProductPayer()
            };

            scope.getPrice = ({ price: { monthly: priceMonthly = '' } = {} } = {}) => {
                // USD
                if (priceMonthly.startsWith('$')) {
                    const [main, ...rest] = priceMonthly.substring(1).split('.');
                    return `$ <span class="bf-main-price">${main}</span>${rest.length ? '.' : ''}${rest.join(
                        ''
                    )}<span class="blackFridayOffer-price-billing-period">${TEXTS.perMonth}</span>`;
                }
                const [main, ...rest] = priceMonthly.split('.');
                // 12.33 CHF
                if (rest.length) {
                    return `<span class="bf-main-price">${main}</span>.${rest.join(
                        ''
                    )}<span class="blackFridayOffer-price-billing-period">${TEXTS.perMonth}</span>`;
                }
                // 12 CHF
                const [price, ...currency] = main.split(' ');
                return `<span class="bf-main-price">${price}</span> ${currency.join(
                    ''
                )}<span class="blackFridayOffer-price-billing-period">${TEXTS.perMonth}</span>`;
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

            const intervalID = setInterval(() => {
                scope.$applyAsync(() => {
                    scope.state.isCyberMonday = isCyberMonday();
                });
            }, 1000);

            scope.$on('destroy', () => {
                element.off('click', onClick);
                unsubscribe();
                clearInterval(intervalID);
            });
        }
    };
}

export default blackFriday;
