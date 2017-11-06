angular.module('proton.dashboard')
    .directive('totalRows', ($filter, $rootScope, dashboardConfiguration, dashboardModel, gettextCatalog) => {

        const I18N = {
            billedAs(amount) {
                return gettextCatalog.getString('Billed as {{amount}} /yr', { amount }, 'Info');
            }
        };

        const types = ['addon.updated', 'cycle.updated', 'currency.updated', 'vpn.updated'];
        const MONTHLY = 1;
        const YEARLY = 12;

        const amount = (plan, cycle, currency, division) => $filter('currency')(dashboardModel.total(plan, cycle) / 100 / division, currency);

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
                        monthly.text(amount(plan, MONTHLY, dashboardConfiguration.currency(), MONTHLY));
                        yearly.text(amount(plan, YEARLY, dashboardConfiguration.currency(), YEARLY));
                        billed.text(I18N.billedAs(amount(plan, YEARLY, dashboardConfiguration.currency(), MONTHLY)));
                        scope.cycle = dashboardConfiguration.cycle();
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
