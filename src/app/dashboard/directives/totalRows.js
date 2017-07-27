angular.module('proton.dashboard')
    .directive('totalRows', ($filter, $rootScope, dashboardModel) => {
        const amount = (plan, cycle, currency, division) => $filter('currency')(dashboardModel.total(plan, cycle) / 100 / division, currency);
        const types = ['addon.updated', 'cycle.updated', 'currency.updated'];
        const MONTHLY = 1;
        const YEARLY = 12;

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/totalRows.tpl.html',
            link(scope, element, { plan }) {
                const monthly = element.find('.totalRows-monthly-price');
                const yearly = element.find('.totalRows-yearly-price');
                const billed = element.find('.totalRows-billed-price');

                scope.onChange = () => $rootScope.$emit('dashboard', { type: 'change.cycle', data: { cycle: scope.cycle } });

                function update() {
                    scope.$applyAsync(() => {
                        monthly.text(amount(plan, MONTHLY, dashboardModel.currency(), MONTHLY));
                        yearly.text(amount(plan, YEARLY, dashboardModel.currency(), YEARLY));
                        billed.text(`Billed as ${amount(plan, YEARLY, dashboardModel.currency(), MONTHLY)} per year`);
                        scope.cycle = dashboardModel.cycle();
                    });
                }

                const unsubscribe = $rootScope.$on('dashboard', (event, { type }) => {
                    (types.indexOf(type) > -1) && update();
                });

                update();

                scope.$on('$destroy', () => {
                    unsubscribe();
                });
            }
        };
    });
