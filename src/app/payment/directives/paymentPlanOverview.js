import { BLACK_FRIDAY, BUNDLE_COUPON_CODE, CYCLE, PLANS, PLANS_TYPE } from '../../constants';
import { getAfterCouponDiscount, getPlansMap, normalizePrice } from '../../../helpers/paymentHelper';
import { getEventName } from '../../blackFriday/helpers/blackFridayHelper';

const { MEMBER, ADDRESS, DOMAIN, SPACE, VPN } = PLANS.ADDON;

const FEATURE_KEYS = ['MaxSpace', 'MaxMembers', 'MaxDomains', 'MaxAddresses', 'MaxVPN'];
const FEATURE_KEYS_VPN = ['MaxVPN'];
const FEATURE_KEYS_MAIL = ['MaxSpace', 'MaxMembers', 'MaxDomains', 'MaxAddresses'];
const ADDONS_MAP = {
    MaxSpace: SPACE,
    MaxMembers: MEMBER,
    MaxDomains: DOMAIN,
    MaxAddresses: ADDRESS,
    MaxVPN: VPN
};

/* @ngInject */
function paymentPlanOverview(
    gettextCatalog,
    $filter,
    subscriptionModel,
    PaymentCache,
    networkActivityTracker,
    dispatchers
) {
    const currencyFilter = (amount, currency) => $filter('currency')(amount / 100, currency);
    const percentageFilter = $filter('percentage');
    const humanFilter = $filter('humanSize');

    const I18N = {
        TOTAL: {
            [CYCLE.MONTHLY]: gettextCatalog.getString('Total (monthly billing)', null, 'Title'),
            [CYCLE.YEARLY]: gettextCatalog.getString('Total (annual billing)', null, 'Title'),
            [CYCLE.TWO_YEARS]: gettextCatalog.getString('Total (2-year billing)', null, 'Title')
        },
        DISCOUNTS: {
            [CYCLE.YEARLY]: gettextCatalog.getString('Discount: 1-year plan', null, 'Title'),
            [CYCLE.TWO_YEARS]: gettextCatalog.getString('Discount: 2-year plan', null, 'Title')
        },
        TOOLTIP: {
            [CYCLE.YEARLY]: (percentage) =>
                gettextCatalog.getString('1-year plan, {{percentage}} off', { percentage }, 'Tooltip'),
            [CYCLE.TWO_YEARS]: (percentage) =>
                gettextCatalog.getString('2-year plan, {{percentage}} off', { percentage }, 'Tooltip')
        },
        COUPONS: {
            [BLACK_FRIDAY.COUPON_CODE]: getEventName(),
            [BUNDLE_COUPON_CODE]: 'Bundle',
            ANY: gettextCatalog.getString('Coupon', null, 'Title')
        },
        PER_MONTH: gettextCatalog.getString('Cost per month', null, 'Title'),
        CREDIT: gettextCatalog.getString('Credit', null, 'Title'),
        PRORATION: gettextCatalog.getString('Proration', null, 'Title'),
        GIFT: gettextCatalog.getString('Gift', null, 'Title'),
        AMOUNT_DUE: gettextCatalog.getString('Amount Due', null, 'Title'),
        FEATURES: {
            [SPACE]: (n) => gettextCatalog.getString('{{amount}} Storage', { amount: humanFilter(n) }, 'Title'),
            [DOMAIN]: (n) =>
                gettextCatalog.getPlural(n, '{{$count}} Custom domain', '{{$count}} Custom domains', {}, 'Title'),
            [MEMBER]: (n) => gettextCatalog.getPlural(n, '{{$count}} User', '{{$count}} Users', {}, 'Title'),
            [ADDRESS]: (n) => gettextCatalog.getPlural(n, '{{$count}} Address', '{{$count}} Addresses', {}, 'Title'),
            [VPN]: (n) =>
                gettextCatalog.getPlural(n, '{{$count}} VPN Connection', '{{$count}} VPN Connections', {}, 'Title')
        }
    };

    const load = (subscription, PlanIDs, Currency, Cycle, CouponCode) => {
        const regularPriceCycle = CouponCode === BLACK_FRIDAY.COUPON_CODE ? CYCLE.YEARLY : Cycle;

        return Promise.all([
            // Individual information
            PaymentCache.plans(),
            // Base price
            PaymentCache.valid({
                PlanIDs,
                Currency,
                Cycle: CYCLE.MONTHLY
            }),
            // Cycle price - without coupon to get cycle discount
            PaymentCache.valid({
                PlanIDs,
                Currency,
                Cycle: regularPriceCycle
            }),
            // Offer price
            PaymentCache.valid({
                PlanIDs,
                Currency,
                Cycle,
                CouponCode
            })
        ]);
    };

    const getPriceString = (amount, currency, cycle, wantedCycle = cycle) => {
        const normalizedPrice = normalizePrice(amount, cycle, wantedCycle);
        const priceTextSuffix = wantedCycle === CYCLE.MONTHLY ? '/mo' : '';
        return currencyFilter(normalizedPrice, currency) + priceTextSuffix;
    };

    /**
     * Returns the plan items the user wants to pay for.
     * Together with the specific feature addons, their amount and price.
     * @param {Object} planIds
     * @param {Object} plans
     * @returns {Array}
     */
    const getPlanItems = (planIds, plans, Currency) => {
        const plansMap = getPlansMap(plans, 'ID');

        const { totalFeatures, addons } = Object.keys(planIds).reduce(
            (acc, id) => {
                const quantity = planIds[id];
                const plan = plansMap[id];

                FEATURE_KEYS.forEach((key) => {
                    acc.totalFeatures[key] = (acc.totalFeatures[key] || 0) + plan[key] * quantity;
                });

                if (plan.Type === PLANS_TYPE.ADDON) {
                    acc.addons[plan.Name] = plan.Amount * quantity;
                }

                return acc;
            },
            { totalFeatures: {}, addons: {} }
        );

        return Object.keys(planIds).reduce((acc, id) => {
            const quantity = planIds[id];
            const { Name, Type, Title, Amount, Cycle } = plansMap[id];

            if (Type === PLANS_TYPE.ADDON) {
                return acc;
            }

            const planText = Title;
            const planAmount = Amount * quantity;

            const isVpnPlan = Name.indexOf('vpn') !== -1;
            const featureKeys = isVpnPlan ? FEATURE_KEYS_VPN : FEATURE_KEYS_MAIL;

            const features = featureKeys.map((key) => {
                const value = totalFeatures[key];
                const addonName = ADDONS_MAP[key];

                const text = I18N.FEATURES[addonName](value);
                const amount = addons[ADDONS_MAP[key]] || 0;

                return {
                    text,
                    price: amount === 0 ? '' : getPriceString(amount, Currency, Cycle, CYCLE.MONTHLY)
                };
            });

            // Always show the mail subscription, if any, before vpn.
            acc[isVpnPlan ? 'push' : 'unshift']({
                text: planText,
                price: getPriceString(planAmount, Currency, Cycle, CYCLE.MONTHLY),
                features
            });

            return acc;
        }, []);
    };

    /**
     * Returns:
     *  The cycle discount, if there is one.
     *  The coupon discount, if there is one.
     * Calculates the cycle discount from the base price.
     * Calculates the real coupon discount because the one from the API includes the cycle discount.
     * @param {Object} basePrice
     * @param {Object} cyclePrice
     * @param {Object} discountPrice
     * @returns {Array}
     */
    const getDiscountItems = (basePrice, cyclePrice, discountPrice) => {
        const result = [];

        const normalizedBasePrice = normalizePrice(basePrice.Amount, basePrice.Cycle, CYCLE.MONTHLY);
        const normalizedCyclePrice = normalizePrice(cyclePrice.Amount, cyclePrice.Cycle, CYCLE.MONTHLY);

        const normalizedPriceAfterCoupon = normalizePrice(
            getAfterCouponDiscount(discountPrice),
            discountPrice.Cycle,
            CYCLE.MONTHLY
        );

        const normalizedCycleDiffAmount = normalizedBasePrice - normalizedCyclePrice;
        const { Cycle, Currency, Coupon, CouponDiscount } = discountPrice;

        if (Cycle > CYCLE.MONTHLY) {
            const percentage = percentageFilter(normalizedCycleDiffAmount / normalizedBasePrice);
            const percentageText = percentage + '%';

            result.push({
                text: I18N.DISCOUNTS[cyclePrice.Cycle],
                price: getPriceString(-normalizedCycleDiffAmount, Currency, CYCLE.MONTHLY),
                className: 'discount',
                tooltip: {
                    text: percentageText,
                    percentage,
                    hover: I18N.TOOLTIP[cyclePrice.Cycle](percentageText)
                }
            });
        }

        if (CouponDiscount < 0) {
            const actualCouponDiscount = normalizedCyclePrice - normalizedPriceAfterCoupon;
            const percentage = percentageFilter(actualCouponDiscount / normalizedCyclePrice);
            const code = Coupon && Coupon.Code;
            const couponName = I18N.COUPONS[code] || code;
            const couponText = `${I18N.COUPONS.ANY}: ${couponName}`;

            result.push({
                text: couponText,
                price: getPriceString(-actualCouponDiscount, Currency, CYCLE.MONTHLY),
                className: 'discount',
                tooltip: {
                    text: percentage + '%',
                    percentage,
                    hover: Coupon.Description
                }
            });
        }

        return result;
    };

    /**
     * Get the credit items the user has in this payment.
     * @param {Object} payment
     * @returns {Array}
     */
    const getCreditItems = ({ Credit, Proration, Currency, Cycle, Gift }) => {
        const result = [];

        Credit !== 0 &&
            result.push({
                text: I18N.CREDIT,
                className: 'discount',
                price: getPriceString(Credit, Currency, Cycle)
            });

        Proration !== 0 &&
            result.push({
                proration: true,
                text: I18N.PRORATION,
                className: 'discount',
                price: getPriceString(Proration, Currency, Cycle)
            });

        Gift !== 0 &&
            result.push({
                text: I18N.GIFT,
                className: 'discount',
                price: getPriceString(Gift, Currency, Cycle)
            });

        return result;
    };

    /**
     * Get the total price excluding credits. Only with the coupon discount.
     * @param {Object} price
     * @returns {Array}
     */
    const getTotalPrice = (price) => {
        const { Cycle, Currency } = price;
        return [
            {
                text: I18N.PER_MONTH,
                price: getPriceString(getAfterCouponDiscount(price), Currency, Cycle, CYCLE.MONTHLY),
                className: 'final'
            },
            {
                text: I18N.TOTAL[Cycle],
                price: getPriceString(getAfterCouponDiscount(price), Currency, Cycle),
                className: 'final'
            }
        ];
    };

    /**
     * Get the final price item.
     * @param {Object}
     * @returns {{text: *, price: *, className: string}}
     */
    const getFinalPrice = ({ AmountDue, Cycle, Currency }) => {
        return {
            text: I18N.AMOUNT_DUE,
            price: getPriceString(AmountDue, Currency, Cycle),
            className: 'final'
        };
    };

    const getList = (planIds, plans, basePrice, cyclePrice, offerPrice) => {
        return [
            ...getPlanItems(planIds, plans, offerPrice.Currency),
            ...getDiscountItems(basePrice, cyclePrice, offerPrice),
            ...getTotalPrice(offerPrice),
            ...getCreditItems(offerPrice),
            getFinalPrice(offerPrice)
        ];
    };

    const doLoad = (scope, promise) => {
        scope.$applyAsync(() => {
            scope.loading = true;
        });

        return promise
            .then((data) => {
                scope.$applyAsync(() => {
                    scope.loading = false;
                });
                return data;
            })
            .catch((e) => {
                scope.$applyAsync(() => {
                    scope.loading = false;
                });
                return Promise.reject(e);
            });
    };

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/payment/paymentPlanOverview.tpl.html'),
        scope: {
            planIds: '<',
            valid: '<'
        },
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            const reload = (valid) => {
                const { Currency, Cycle, Coupon } = valid;
                /**
                     Why do we use coupon() here if it's not defined? It's because it is called with the subscription coupon from selectPlan()
                     But the API can return a null COUPON in that case. It automatically adds the BUNDLE discount if it's called with undefined.
                     So make sure we call with exactly the same parameters here.
                 */
                const CouponCode = Coupon ? Coupon.Code : subscriptionModel.coupon();

                const promise = load(subscriptionModel.get(), scope.planIds, Currency, Cycle, CouponCode).then(
                    ([plans, basePrice, cyclePrice, offerPrice]) => {
                        scope.$applyAsync(() => {
                            scope.list = getList(scope.planIds, plans, basePrice, cyclePrice, offerPrice);
                        });
                    }
                );

                return networkActivityTracker.track(doLoad(scope, promise));
            };

            reload(scope.valid);

            on('modal.payment', (e, { type, data }) => {
                if (type === 'payment.change') {
                    reload(data);
                }
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default paymentPlanOverview;
