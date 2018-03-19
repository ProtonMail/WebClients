import _ from 'lodash';

/* @ngInject */
function currencySelector(dashboardConfiguration, dispatchers) {
    const ACTIVE_BUTTON_CLASS = 'active';

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/dashboard/currencySelector.tpl.html'),
        link(scope, element) {
            const currency = dashboardConfiguration.currency();
            const $buttons = element.find('.currencySelector-button');
            const { dispatcher, on, unsubscribe } = dispatchers(['dashboard']);

            function onClick(event) {
                const currency = event.target.getAttribute('value');

                dispatcher.dashboard('change.currency', { currency });
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

            on('subscription', (event, { type, data }) => {
                type === 'update' && active(data.subscription.Currency);
            });

            active(currency);

            scope.$on('$destroy', () => {
                unsubscribe();
                element.off('click', onClick);
            });
        }
    };
}
export default currencySelector;
