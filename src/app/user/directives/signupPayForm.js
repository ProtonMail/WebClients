angular.module('proton.user')
    .directive('signupPayForm', (paymentUtils, $rootScope, $stateParams, cardModel) => {

        const dispatch = (data) => $rootScope.$emit('signup', { type: 'payform.submit', data });

        return {
            replace: true,
            scope: {
                plan: '=',
                account: '='
            },
            templateUrl: 'templates/user/signupPayForm.tpl.html',
            link(scope, el) {

                const $btnFeatures = el.find('.signupPayForm-btn-features');
                const { list, selected } = paymentUtils.generateMethods({
                    Cycle: +$stateParams.billing
                });

                scope.methods = list;
                scope.method = selected;

                scope.onPaypalSuccess = (Details) => {
                    dispatch({
                        form: scope.account,
                        source: scope.method.value,
                        payment: {
                            Amount: scope.plan.Amount,
                            Currency: scope.plan.Currency,
                            method: { Type: 'paypal', Details }
                        }
                    });
                };

                const unsubscribe = $rootScope.$on('signup', (e, { type }) => {
                    if (type === 'payment.verify.error') {
                        scope.$applyAsync(() => scope.errorPay = true);
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
                        dispatch({
                            form: scope.account,
                            source: scope.method.value,
                            payment: {
                                Amount: scope.plan.Amount,
                                Currency: scope.plan.Currency,
                                method: { Type: 'card', Details: card.details() }
                            }
                        });
                    });
                };

                const onReset = () => scope.$applyAsync(() => scope.errorPay = true);

                el.on('reset', onReset);
                el.on('submit', onSubmit);
                $btnFeatures.on('click', onToggleFeature);

                scope.$on('$destroy', () => {
                    el.off('reset', onReset);
                    el.off('submit', onSubmit);
                    $btnFeatures.off('click', onToggleFeature);
                    unsubscribe();
                });
            }
        };
    });
