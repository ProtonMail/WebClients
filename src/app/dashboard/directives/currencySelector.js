angular.module('proton.dashboard')
    .directive('currencySelector', ($rootScope, dashboardConfiguration) => {
        const ACTIVE_BUTTON_CLASS = 'active';

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/dashboard/currencySelector.tpl.html',
            link(scope, element) {
                const currency = dashboardConfiguration.currency();
                const $buttons = element.find('.currencySelector-button');

                function onClick(event) {
                    const currency = event.target.getAttribute('value');

                    $rootScope.$emit('dashboard', { type: 'change.currency', data: { currency } });
                    active(currency);
                }

                function active(currency) {
                    _.each($buttons, (button) => {
                        if (button.value === currency) {
                            button.classList.add(ACTIVE_BUTTON_CLASS);
                        } else {
                            button.classList.remove(ACTIVE_BUTTON_CLASS);
                        }
                    });
                }

                element.on('click', onClick);

                const unsubscribe = $rootScope.$on('subscription', (event, { type, data }) => {
                    (type === 'update') && active(data.subscription.Currency);
                });

                active(currency);

                scope.$on('$destroy', () => {
                    unsubscribe();
                    element.off('click', onClick);
                });
            }
        };
    });
