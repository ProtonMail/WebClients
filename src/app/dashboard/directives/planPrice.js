angular.module('proton.dashboard')
    .directive('planPrice', ($filter, $rootScope, dashboardConfiguration, dashboardModel, gettextCatalog) => {
        const types = ['cycle.updated', 'currency.updated'];
        const I18N = {
            month: gettextCatalog.getString('month', null)
        };
        const amount = (plan, cycle, currency) => {
            const amounts = dashboardModel.amounts(cycle);

            return `${$filter('currency')(amounts[plan] / 100 / cycle, currency)}/${I18N.month}`;
        };

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: '<strong class="planPrice"></strong>',
            link(scope, element, { plan }) {
                function update() {
                    scope.$applyAsync(() => {
                        element.text(amount(plan, dashboardConfiguration.cycle(), dashboardConfiguration.currency()));
                    });
                }

                const unsubscribe = $rootScope.$on('dashboard', (event, { type }) => {
                    (types.indexOf(type) > -1) && update();
                });

                update();

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
