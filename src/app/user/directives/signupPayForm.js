import { BLACK_FRIDAY, CYCLE } from '../../constants';
import { getEventName } from '../../blackFriday/helpers/blackFridayHelper';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

/* @ngInject */
function signupPayForm(paymentUtils, dispatchers, cardModel, giftCodeModel, notification, gettextCatalog, $filter) {
    const I18N = {
        invalidGiftCode: gettextCatalog.getString('Invalid gift code', null, 'Error'),
        month: gettextCatalog.getString('month', null, 'Info'),
        billing: {
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
    };

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
            paypal: 'signupPayForm-method-paypal',
            error: 'signupPayForm-error'
        }
    };

    const filter = (amount, currency) => $filter('currency')(amount / 100, currency);

    const getPrice = ({ Cycle, AmountDue, Currency }, { AmountDue: AmountDueGift }) => {
        // To review: Why take the amount due from the gift?
        const amountDue = AmountDueGift || AmountDue;

        const price = filter(amountDue, Currency);

        if (Cycle === MONTHLY) {
            return price;
        }

        const monthlyPrice = filter(amountDue / Cycle, Currency);
        return `${price} (${monthlyPrice} / ${I18N.month})`;
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
                Cycle: scope.payment.Cycle
            });

            scope.methods = list;
            scope.method = selected;
            scope.giftModel = {};

            el.find('.signupPayForm-thanks').html(I18N.thanks(scope.payment.Coupon));

            const setClassNames = () => {
                const classNames = {
                    [CLASSNAMES.couponCode.has]: !!scope.payment.Coupon,
                    [CLASSNAMES.giftCode.has]: !!scope.giftModel.Gift,
                    [CLASSNAMES.payment.paypal]: scope.method.value === 'paypal',
                    [CLASSNAMES.payment.error]: !!scope.errorPay
                };

                Object.keys(classNames).forEach((className) => {
                    el[0].classList[classNames[className] ? 'add' : 'remove'](className);
                });
            };

            const setPlan = () => {
                scope.plan = {
                    name: scope.plans.map(({ Title }) => Title).join(' + '),
                    price: getPrice(scope.payment, scope.giftModel),
                    billing: I18N.billing[scope.payment.Cycle]
                };
            };

            const dispatchPayformSubmit = (Payment) => {
                dispatchHelper('payform.submit', {
                    Amount: scope.giftModel.AmountDue || scope.payment.AmountDue,
                    Currency: scope.payment.Currency,
                    GiftCode: scope.giftCode,
                    Credit: scope.giftModel.Credit,
                    Payment
                });
            };

            scope.onPaymentMethodChange = () => {
                setClassNames();
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

            on('signup', (e, { type = '', data = {} }) => {
                if (type === 'payment.verify.error') {
                    scope.$applyAsync(() => {
                        scope.errorPay = true;
                        setClassNames();
                    });
                }

                if (type === 'displayGiftSignup') {
                    el[0].classList.add(CLASSNAMES.giftCode.show);
                }

                if (type === 'gift.applied') {
                    el[0].classList.add(CLASSNAMES.giftCode.applied);

                    scope.$applyAsync(() => {
                        scope.giftModel = data;
                        setPlan();
                        changeValue();
                        setClassNames();
                    });
                }
            });

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();

                scope.$applyAsync(() => {
                    scope.errorPay = false;
                    setClassNames();
                    const card = cardModel(scope.account.card);
                    dispatchPayformSubmit({ Type: 'card', Details: card.details() });
                });
            };

            const onReset = () =>
                scope.$applyAsync(() => {
                    scope.errorPay = true;
                    setClassNames();
                });

            const onApply = () => {
                if (!scope.giftCode || !giftCodeModel.isValid(scope.giftCode)) {
                    return notification.error(I18N.invalidGiftCode);
                }

                dispatchHelper('apply.gift', {
                    Credit: scope.plan.Amount,
                    Currency: scope.plan.Currency,
                    GiftCode: scope.giftCode
                });
            };

            setClassNames();
            setPlan();

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
