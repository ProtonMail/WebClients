import { PLANS } from '../../constants';

const { VPN_PLUS, VPN_BASIC } = PLANS.PLAN;

/* @ngInject */
function vpnSlider(customVpnModel, dashboardConfiguration, dashboardModel, dispatchers) {
    const VPN_PLUS_SELECTED = 'vpnSlider-vpnplus-selected';
    const VPN_BASIC_SELECTED = 'vpnSlider-vpnbasic-selected';
    const onClick = (event) => {
        const action = event.target.getAttribute('data-action');

        switch (action) {
            case 'vpnplus':
                customVpnModel.set('vpnbasic', 0);
                customVpnModel.set('vpnplus', 1);
                break;
            default:
                break;
        }
    };
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/dashboard/vpnSlider.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const $count = element.find('.vpnSlider-count');
            const { addons } = dashboardModel.get(dashboardConfiguration.cycle());
            const vpnbasic = addons[VPN_BASIC];
            const vpnplus = addons[VPN_PLUS];
            const { value, options } = customVpnModel.parameters();
            const updateCount = () => {
                if (customVpnModel.get('vpnbasic')) {
                    $count.text(`${vpnbasic.MaxVPN}`);
                }

                if (customVpnModel.get('vpnplus')) {
                    $count.text(`${vpnplus.MaxVPN + customVpnModel.get('vpn')}`);
                }
            };
            const updateSlider = () => {
                if (customVpnModel.get('vpnplus')) {
                    scope.$applyAsync(
                        () => (scope.value = customVpnModel.get('vpnplus') * vpnplus.MaxVPN + customVpnModel.get('vpn'))
                    );
                }
            };
            const updateClass = () => {
                element[0].classList.toggle(VPN_PLUS_SELECTED, customVpnModel.get('vpnplus'));
                element[0].classList.toggle(VPN_BASIC_SELECTED, customVpnModel.get('vpnbasic'));
            };

            on('dashboard', (event, { type = '' }) => {
                if (type === 'vpn.modal.updated') {
                    updateCount();
                    updateSlider();
                    updateClass();
                }
            });

            scope.value = value;
            scope.options = options;
            element.on('click', onClick);
            scope.$on('$destroy', () => {
                element.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default vpnSlider;
