angular.module('proton.dashboard')
    .directive('planPrice', ($filter, $rootScope, dashboardConfiguration, dashboardModel, gettextCatalog) => {
        const types = ['cycle.updated', 'currency.updated'];
        const I18N = {
            user: gettextCatalog.getString('user', null),
            month: gettextCatalog.getString('month', null)
        };
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
