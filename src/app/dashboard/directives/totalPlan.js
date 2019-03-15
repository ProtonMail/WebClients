/* @ngInject */
function totalPlan($filter, dashboardConfiguration, dashboardModel, dispatchers, gettextCatalog) {
    const amount = (plan, cycle, currency) =>
        $filter('currency')(dashboardModel.total(plan, cycle) / 100 / cycle, currency);
    const types = ['addon.updated', 'cycle.updated', 'currency.updated', 'vpn.updated'];

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: '<strong class="totalPlan"></strong>',
        link(scope, element, { plan }) {
            const { on, unsubscribe } = dispatchers();
            const month = gettextCatalog.getString('month', null, 'Info');

            function update() {
                scope.$applyAsync(() => {
                    element.text(
                        `${amount(plan, dashboardConfiguration.cycle(), dashboardConfiguration.currency())}/${month}`
                    );
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
export default totalPlan;
