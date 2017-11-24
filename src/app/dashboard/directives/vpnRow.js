angular.module('proton.dashboard')
    .directive('vpnRow', ($rootScope, CONSTANTS, dashboardConfiguration, dashboardModel, gettextCatalog, subscriptionModel, customVpnModal) => {
        const HAS_VPN_CLASS = 'vpnRow-has-vpn';
        const VPN_BASIC_CLASS = 'vpnRow-vpnbasic';
        const VPN_PLUS_CLASS = 'vpnRow-vpnplus';
        const { VPN_BASIC, VPN_PLUS } = CONSTANTS.PLANS.PLAN;
        const { VPN } = CONSTANTS.PLANS.ADDON;
        const { MONTHLY } = CONSTANTS.CYCLE;
        const getName = (config = {}) => (config.vpnplus ? 'ProtonVPN Plus' : 'ProtonVPN Basic');
        const getClass = (config = {}) => (config.vpnplus ? VPN_PLUS_CLASS : VPN_BASIC_CLASS);
        const initVpn = (plan) => $rootScope.$emit('dashboard', { type: 'init.vpn', data: { plan } });
        const I18N = {
            with: gettextCatalog.getString('with', null, 'ProtonVPN with X connections'),
            connections: gettextCatalog.getString('connections', null, 'ProtonVPN with X connections')
        };

        const openModal = (plan) => {
            customVpnModal.activate({
                params: {
                    plan,
                    close() {
                        customVpnModal.deactivate();
                    }
                }
            });
        };


        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/vpnRow.tpl.html',
            link(scope, element, { plan }) {
                const getAmount = () => {
                    const vpnbasic = dashboardModel.amount({ plan, addon: 'vpnbasic' });
                    const vpnplus = dashboardModel.amount({ plan, addon: 'vpnplus' });
                    const vpn = dashboardModel.amount({ plan, addon: 'vpn' });
                    const amount = vpnbasic + vpnplus + (plan === 'professional' ? vpn : 0);
                    const cycle = dashboardConfiguration.cycle() === MONTHLY ? '' : '/mo';

                    return `+ ${dashboardModel.filter(amount)} ${cycle}`;
                };
                const getConnections = (config) => {
                    const { addons } = dashboardModel.get(dashboardConfiguration.cycle());
                    const connections = (key) => addons[key].MaxVPN;
                    const vpnbasic = config.vpnbasic * connections(VPN_BASIC);
                    const vpnplus = config.vpnplus * connections(VPN_PLUS);
                    const vpn = config.vpn * connections(VPN);
                    const number = vpnbasic + vpnplus + (plan === 'professional' ? vpn : 0);

                    return `${number} ${I18N.connections}`;
                };
                const $info = element.find('.vpnRow-info');
                const buildString = (config) => $info.html(`
                    <div class="vpnRow-left">
                        <b class="${getClass(config)}">${getName(config)}</b> ${I18N.with} <button type="button" class="vpnRow-edit" data-action="open-vpn-modal">${getConnections(config)}</button>
                    </div>
                    <div class="vpnRow-right">
                        <strong>${getAmount()}</strong>
                    </div>
                `);
                const update = () => {
                    const config = dashboardConfiguration.get()[plan];

                    if (config.vpnplus || config.vpnbasic) {
                        element.addClass(HAS_VPN_CLASS);
                        buildString(config);
                    } else {
                        element.removeClass(HAS_VPN_CLASS);
                    }
                };

                const onClick = (event) => {
                    const action = event.target.getAttribute('data-action');

                    (action === 'open-vpn-modal') && openModal(plan);
                };

                const unsubscribe = $rootScope.$on('dashboard', (event, { type }) => {
                    if (type === 'currency.updated' || type === 'cycle.updated') {
                        update();
                    }

                    if (type === 'vpn.updated') {
                        update();
                    }
                });

                element.on('click', onClick);
                initVpn(plan);

                scope.$on('$destroy', () => {
                    unsubscribe();
                    element.off('click', onClick);
                });
            }
        };
    });
