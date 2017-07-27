angular.module('proton.dashboard')
    .directive('totalPlan', ($filter, $rootScope, dashboardConfiguration, dashboardModel, gettextCatalog) => {
        const amount = (plan, cycle, currency) => $filter('currency')(dashboardModel.total(plan, cycle) / 100 / cycle, currency);
        const types = ['addon.updated', 'cycle.updated', 'currency.updated'];
        const month = gettextCatalog.getString('month', null);

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: '<strong class="totalPlan"></strong>',
            link(scope, element, { plan }) {
                function update() {
                    scope.$applyAsync(() => {
                        element.text(`${amount(plan, dashboardConfiguration.cycle(), dashboardConfiguration.currency())}/${month}`);
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
