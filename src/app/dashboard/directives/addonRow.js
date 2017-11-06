angular.module('proton.dashboard')
    .directive('addonRow', ($filter, $rootScope, CONSTANTS, dashboardConfiguration, dashboardModel, dashboardOptions, gettextCatalog, subscriptionModel, customProPlanModel) => {

        customProPlanModel.init();
        const { MEMBER, ADDRESS, DOMAIN, SPACE } = CONSTANTS.PLANS.ADDON;
        const MAP_ADDONS = { member: MEMBER, address: ADDRESS, domain: DOMAIN, space: SPACE };

        const filter = (amount) => $filter('currency')(amount / 100 / dashboardConfiguration.cycle(), dashboardConfiguration.currency());
        const initValue = (addon) => `${subscriptionModel.count(addon)}`;
        const getPrice = ({ addon, value }) => {
            if (!value || value === 'none') {
                return '';
            }

            const cycle = dashboardConfiguration.cycle() === 12 ? '/mo' : '';
            const amounts = dashboardModel.amounts();

            return `+ ${filter(amounts[MAP_ADDONS[addon]] * value)}${cycle}`;
        };
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/addonRow.tpl.html',
            compile(element, { addon, plan }) {
                const $select = element.find('.addonRow-select');
                const set = (value = initValue(addon)) => $select.val(value);

                function buildOptions() {
                    const options = _.reduce(dashboardOptions.get(plan, addon), (acc, { label, value }) => {
                        return acc + `<option value="${value}">${label} ${getPrice({ addon, value })}</option>`;
                    }, '');

                    $select.html(options);
                }

                buildOptions();

                return (scope) => {
                    const onChange = () => $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon, plan, value: +$select.val() } });
                    const unsubscribe = $rootScope.$on('dashboard', (event, { type, data = {} }) => {
                        if (type === 'addon.updated' && data.addon === addon && data.plan === plan) {
                            buildOptions();
                            set(data.value);
                        }

                        if (type === 'currency.updated' || type === 'cycle.updated') {
                            const value = $select.val();

                            buildOptions();
                            set(value);
                        }
                    });

                    $select.on('change', onChange);
                    set();
                    onChange();

                    scope.$on('$destroy', () => {
                        unsubscribe();
                        $select.off('change', onChange);
                    });
                };
            }
        };
    });
