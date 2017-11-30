angular.module('proton.user')
    .directive('signupPayForm', (paymentUtils, $rootScope, $stateParams, cardModel) => {

        const dispatch = (type, data) => $rootScope.$emit('signup', { type, data });

        return {
            replace: true,
            scope: {
                plan: '=',
                account: '='
            },
            templateUrl: 'templates/user/signupPayForm.tpl.html',
            link(scope, el) {

                const $btnFeatures = el.find('.signupPayForm-btn-features');
                const $btnApply = el.find('.signupPayForm-btn-apply');
                const { list, selected } = paymentUtils.generateMethods({
                    Cycle: +$stateParams.billing
                });

                scope.methods = list;
                scope.method = selected;
                scope.giftModel = {};

                scope.onPaypalSuccess = (Details) => {
                    dispatch('payform.submit', {
                        form: scope.account,
                        source: scope.method.value,
                        payment: {
                            Amount: scope.giftModel.AmountDue || scope.plan.Amount,
                            Currency: scope.plan.Currency,
                            method: { Type: 'paypal', Details }
                        }
                    });
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

                const unsubscribe = $rootScope.$on('signup', (e, { type = '', data = {} }) => {
                    if (type === 'payment.verify.error') {
                        scope.$applyAsync(() => scope.errorPay = true);
                    }

                    if (type === 'displayGiftSignup') {
                        el[0].classList.add('signupPayForm-show-gift');
                    }

                    if (type === 'gift.applied') {
                        el[0].classList.add('signupPayForm-gift-applied');
                        scope.$applyAsync(() => {
                            scope.giftModel = data;
                            changeValue();
                        });
                    }
                });

                const onToggleFeature = ({ target }) => {
                    target.classList.toggle('signupPayForm-btn-features-active');
                    el[0].classList.toggle('signupPayForm-show-features');
                };

                const onSubmit = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    scope.$applyAsync(() => {

                        scope.errorPay = false;

                        const card = cardModel(scope.account.card);
                        dispatch('payform.submit', {
                            form: scope.account,
                            source: scope.method.value,
                            payment: {
                                Amount: scope.giftModel.AmountDue || scope.plan.Amount,
                                Currency: scope.plan.Currency,
                                GiftCode: scope.giftCode,
                                Credit: scope.giftModel.Credit,
                                method: { Type: 'card', Details: card.details() }
                            }
                        });
                    });
                };

                const onReset = () => scope.$applyAsync(() => scope.errorPay = true);

                const onApply = () => {
                    dispatch('apply.gift', {
                        Credit: scope.plan.Amount,
                        Currency: scope.plan.Currency,
                        GiftCode: scope.giftCode
                    });
                };

                el.on('reset', onReset);
                el.on('submit', onSubmit);
                $btnApply.on('click', onApply);
                $btnFeatures.on('click', onToggleFeature);

                scope.$on('$destroy', () => {
                    el.off('reset', onReset);
                    el.off('submit', onSubmit);
                    $btnApply.off('click', onApply);
                    $btnFeatures.off('click', onToggleFeature);
                    unsubscribe();
                });
            }
        };
    });
