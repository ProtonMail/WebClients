angular.module('proton.dashboard')
    .directive('professionalColumn', ($rootScope, CONSTANTS, customProPlanModal, dashboardModel, gettextCatalog, subscriptionModel) => {
        const PROFESSIONAL = CONSTANTS.PLANS.PLAN.PROFESSIONAL;
        const MEMBER = CONSTANTS.PLANS.ADDON.MEMBER;
        const BASE = CONSTANTS.BASE_SIZE;

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/professionalColumn.tpl.html',
            link(scope, element) {
                const number = subscriptionModel.count('member');
                const $buttons = element.find('.professionalColumn-customize');
                const $space = element.find('.professionalColumn-space-value');
                const $address = element.find('.professionalColumn-address-value');
                const { addons, plan } = dashboardModel.get(dashboardModel.cycle());
                const professional = plan[PROFESSIONAL];
                const member = addons[MEMBER];
                const unsubscribe = $rootScope.$on('dashboard', (event, { type, data = {} }) => {
                    if (type === 'addon.updated' && data.addon === 'member') {
                        update(data.value);
                    }
                });

                $buttons.on('click', onClick);

                function onClick() {
                    customProPlanModal.activate({
                        params: {
                            close() {
                                customProPlanModal.deactivate();
                            }
                        }
                    });
                }

                function update(n) {
                    $space.text(gettextCatalog.getPlural((n * member.MaxSpace + professional.MaxSpace) / (BASE * BASE * BASE), '1 GB Storage', '{{$count}} GB Storage', {}));
                    $address.text(gettextCatalog.getString('{{value}} Addresses', { value: n * member.MaxAddresses + professional.MaxAddresses }));
                }

                update(number);

                scope.$on('$destroy', () => {
                    unsubscribe();
                    $buttons.off('click', onClick);
                });
            }
        };
    });
