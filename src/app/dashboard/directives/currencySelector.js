/* @ngInject */
function dashboardCurrencySelector(dashboardConfiguration, dispatchers) {
    return {
        restrict: 'E',
        template: '<currency-selector data-currency="{{ ::currency }}" data-name="dashboardCurrency">',
        scope: {},
        link(scope) {
            const { on, dispatcher, unsubscribe } = dispatchers(['dashboardCurrency', 'dashboard']);

            scope.currency = dashboardConfiguration.currency();

            on('subscription', (event, { type, data }) => {
                type === 'update' && dispatcher.dashboardCurrency('set', data.subscription.Currency);
            });

            on('dashboardCurrency', (event, { type, data }) => {
                type === 'change' && dispatcher.dashboard('change.currency', { currency: data });
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}

export default dashboardCurrencySelector;
