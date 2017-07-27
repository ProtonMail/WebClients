angular.module('proton.dashboard')
    .directive('addonRow', ($filter, $rootScope, dashboardConfiguration, dashboardModel, dashboardOptions, gettextCatalog, subscriptionModel) => {
        const types = ['addon.updated', 'currency.updated', 'cycle.updated'];
        const filter = (amount) => $filter('currency')(amount / 100 / dashboardConfiguration.cycle(), dashboardConfiguration.currency());
        const initValue = (addon) => {
            if (addon === 'vpn') {
                const { Plans = [] } = subscriptionModel.get();

                if (_.findWhere(Plans, { Name: 'vpnbasic' })) {
                    return 'vpnbasic';
                }

                if (_.findWhere(Plans, { Name: 'vpnplus' })) {
                    return 'vpnplus';
                }

                return 'none';
            }

            return `${subscriptionModel.count(addon)}`;
        };
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/addonRow.tpl.html',
            compile(element, { addon, plan }) {
                const $select = element.find('.addonRow-select');
                const $price = element.find('.addonRow-price');
                const options = _.reduce(dashboardOptions.get(plan, addon), (acc, { label, value }) => {
                    return acc + `<option value="${value}">${label}</option>`;
                }, '');

                $select.append(options);

                // For VPN addon row we need to add a ProtonVPN String
                if (addon === 'vpn') {
                    element.find('.pm_select').before('<span class="addonRow-vpn">ProtonVPN</span>');
                }

                return (scope) => {
                    const value = initValue(addon);
                    const onChange = () => {
                        if (addon === 'vpn') {
                            $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon, plan: 'free', value: $select.val() } });
                            $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon, plan: 'plus', value: $select.val() } });
                            $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon, plan: 'professional', value: $select.val() } });
                            return;
                        }

                        $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon, plan, value: $select.val() } });
                    };
                    const unsubscribe = $rootScope.$on('dashboard', (event, { type, data = {} }) => {
                        if (types.indexOf(type) > -1) {
                            data.addon === addon && data.plan === plan && $select.val(data.value);
                            const amount = dashboardModel.amount({ plan, addon });
                            $price.text(amount > 0 ? `+ ${filter(amount)}` : '');
                        }
                    });

                    $select.on('change', onChange);
                    $select.val(value);
                    onChange();

                    scope.$on('$destroy', () => {
                        unsubscribe();
                        $select.off('change', onChange);
                    });
                };
            }
        };
    });
