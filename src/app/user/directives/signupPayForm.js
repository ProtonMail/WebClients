import { BLACK_FRIDAY, CYCLE } from '../../constants';
import { getEventName } from '../../blackFriday/helpers/blackFridayHelper';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

/* @ngInject */
function signupPayForm(
    paymentUtils,
    dispatchers,
    cardModel,
    notification,
    gettextCatalog,
    $filter,
    translator
) {

    const I18N = translator(() => ({
        MONTH: gettextCatalog.getString('month', null, 'Info'),
        BILLING: {
            [YEARLY]: gettextCatalog.getString('Annually', null, 'Info'),
            [MONTHLY]: gettextCatalog.getString('Monthly', null, 'Info'),
            [TWO_YEARS]: gettextCatalog.getString('Every 2 years', null, 'Info')
        },
        thanks(Coupon) {
            // NOTE: Coupon can be `null` from the API, so can't destructure.
            const { Code } = Coupon || {};
            if (Code === BLACK_FRIDAY.COUPON_CODE) {
                return `Thank you for choosing ProtonMail. <br>The ${getEventName()} discount has been automatically applied.`;
            }
            return gettextCatalog.getString('Thank you for your support!', null, 'Title');
        }
    }));

    const CLASSNAMES = {
        couponCode: {
            has: 'signupPayForm-has-couponCode'
        },
        giftCode: {
            has: 'signupPayForm-has-giftCode',
            show: 'signupPayForm-show-gift',
            applied: 'signupPayForm-gift-applied'
        },
        payment: {
            hidden: 'signupPayForm-method-hidden',
            paypal: 'signupPayForm-method-paypal',
            error: 'signupPayForm-error'
        }
    };

    /**
     * Set class names on the container to hide or show information.
     * @param {HTMLElement} el
     * @param {Object} payment
     * @param {Object} method
     * @param {boolean} errorPay
     */
    const setClassNames = (el, { Coupon, Gift, AmountDue }, method, errorPay) => {
        const classNames = {
            [CLASSNAMES.couponCode.has]: !!Coupon,
            [CLASSNAMES.giftCode.has]: !!Gift,
            [CLASSNAMES.payment.hidden]: AmountDue === 0,
            [CLASSNAMES.payment.paypal]: method.value === 'paypal',
            [CLASSNAMES.payment.error]: !!errorPay
        };

        Object.keys(classNames).forEach((className) => {
            el[0].classList[classNames[className] ? 'add' : 'remove'](className);
        });
    };

    const priceFilter = (amount, currency) => $filter('currency')(amount / 100, currency);

    const getPrice = ({ Cycle, AmountDue, Currency }) => {
        const price = priceFilter(AmountDue, Currency);

        if (Cycle === MONTHLY || AmountDue === 0) {
            return price;
        }

        const monthlyPrice = priceFilter(AmountDue / Cycle, Currency);
        return `${price} (${monthlyPrice} / ${I18N.MONTH})`;
    };

    const getPlan = (payment, plans = []) => {
        return {
            name: plans.map(({ Title }) => Title).join(' + '),
            price: getPrice(payment),
            gift: priceFilter(payment.Gift, payment.Currency),
            billing: I18N.BILLING[payment.Cycle]
        };
    };

    /**
     * Get the payment payload needed for the verify call.
     * @param {Object} payment data from the check route
     * @param {Object} Payment payment method information
     * @param {String} giftCode
     * @returns {Object}
     */
    const getPaymentPayload = ({ AmountDue, Currency, Amount, CouponDiscount }, Payment, giftCode) => {
        if (giftCode) {
            return {
                Amount: AmountDue,
                Currency,
                // It's weird but when a gift code exists, pass the Amount (and remove any coupon discount) as Credit.
                Credit: Amount + CouponDiscount,
                GiftCode: giftCode,
                Payment
            };
        }

        return {
            Amount: AmountDue,
            Currency,
            Payment
        };
    };

    return {
        replace: true,
        scope: {
            plans: '<',
            payment: '<',
            account: '<'
        },
        templateUrl: require('../../../templates/user/signupPayForm.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe, dispatcher } = dispatchers(['signup']);

            const dispatchHelper = (type, data) => dispatcher.signup(type, data);

            const $btnApply = el.find('.signupPayForm-btn-apply');

            const { list, selected } = paymentUtils.generateMethods({
                Cycle: scope.payment.Cycle,
                Amount: scope.payment.AmountDue,
                CouponCode: scope.payment.Coupon && scope.payment.Coupon.Code
            });

            scope.methods = list;
            scope.method = selected;

            el.find('.signupPayForm-thanks').html(I18N.thanks(scope.payment.Coupon));

            const dispatchPayformSubmit = (Payment) => {
                dispatchHelper('payform.submit', getPaymentPayload(scope.payment, Payment, scope.giftCode));
            };

            scope.onPaymentMethodChange = () => {
                setClassNames(el, scope.payment, scope.method, scope.errorPay);
            };

            scope.onPaypalSuccess = (Details) => {
                dispatchPayformSubmit({ Type: 'paypal', Details });
            };

            /**
             * Refresh component such as paypal/bitcoin
             */
            const changeValue = () => {
                const ghost = scope.method.value;

                if (ghost === 'paypal') {
                    scope.method.value = '';
                    _rAF(() => {
                        scope.$applyAsync(() => (scope.method.value = ghost));
                    });
                }
            };

            on('signup', (e, { type = '', data }) => {
                if (type === 'payment.verify.error') {
                    scope.$applyAsync(() => {
                        scope.errorPay = true;
                        setClassNames(el, scope.payment, scope.method, scope.errorPay);
                    });
                }

                if (type === 'displayGiftSignup') {
                    el[0].classList.add(CLASSNAMES.giftCode.show);
                }

                if (type === 'gift.applied') {
                    el[0].classList.add(CLASSNAMES.giftCode.applied);

                    scope.$applyAsync(() => {
                        /**
                         * If amount due becomes 0, we will hide the payment methods.
                         * However, we also switch to the card method because otherwise
                         * the payment will not work.
                         */
                        if (data.AmountDue === 0) {
                            scope.method.value = 'card';
                        }
                        /*
                         * Using the dispatched value instead of the scope because when
                         * the dispatch happens, the scope has not been updated yet.
                         */
                        scope.plan = getPlan(data, scope.plans);
                        setClassNames(el, data, scope.method, scope.errorPay);
                        changeValue();
                    });
                }
            });

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();

                scope.$applyAsync(() => {
                    scope.errorPay = false;
                    setClassNames(el, scope.payment, scope.method, scope.errorPay);
                    const card = cardModel(scope.account.card);
                    dispatchPayformSubmit({ Type: 'card', Details: card.details() });
                });
            };

            const onReset = () =>
                scope.$applyAsync(() => {
                    scope.errorPay = true;
                    setClassNames(el, scope.payment, scope.method, scope.errorPay);
                });

            const onApply = () => {
                dispatchHelper('giftcode.submit', scope.giftCode);
            };

            setClassNames(el, scope.payment, scope.method, scope.errorPay);
            scope.plan = getPlan(scope.payment, scope.plans);

            el.on('reset', onReset);
            el.on('submit', onSubmit);
            $btnApply.on('click', onApply);

            scope.$on('$destroy', () => {
                el.off('reset', onReset);
                el.off('submit', onSubmit);
                $btnApply.off('click', onApply);
                unsubscribe();
            });
        }
    };
}

export default signupPayForm;
