/* @ngInject */
function planPrice($filter, dashboardConfiguration, dashboardModel, dispatchers, gettextCatalog, translator) {
    const types = ['cycle.updated', 'currency.updated'];
    const I18N = translator(() => ({
        user: gettextCatalog.getString('user', null, 'Label'),
        month: gettextCatalog.getString('month', null, 'Delay')
    }));
    const amount = (plan, cycle, currency) => {
        const amounts = dashboardModel.amounts(cycle);
        const month = `/${I18N.month}`;
        const user = plan === 'professional' ? `/${I18N.user}` : '';

        return `${$filter('currency')(amounts[plan] / 100 / cycle, currency)}${month}${user}`;
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: '<strong class="planPrice"></strong>',
        link(scope, element, { plan }) {
            const { on, unsubscribe } = dispatchers();

            function update() {
                scope.$applyAsync(() => {
                    element.text(amount(plan, dashboardConfiguration.cycle(), dashboardConfiguration.currency()));
                });
            }

            on('dashboard', (event, { type }) => {
                types.indexOf(type) > -1 && update();
            });

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default planPrice;
