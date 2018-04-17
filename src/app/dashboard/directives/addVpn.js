/* @ngInject */
function addVpn($rootScope, gettextCatalog) {
    const ADD_PROTONVPN = gettextCatalog.getString('+ Add ProtonVPN', null, 'Button');
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: `<button class="addVpn-button" type="button">
                            <div class="addVpn-button-wrapper">
                                <i class="addVpn-button-sign"></i>
                                <span class="addVpn-button-txt">${ADD_PROTONVPN}</span>
                            </div>
                        </button>`,
        link(scope, element, { plan }) {
            const value = plan === 'free' ? 'vpnbasic' : 'vpnplus';
            const onClick = () => {
                $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon: 'vpn', plan: 'free', value } });
                $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon: 'vpn', plan: 'plus', value } });
                $rootScope.$emit('dashboard', {
                    type: 'change.addon',
                    data: { addon: 'vpn', plan: 'professional', value }
                });
            };

            element.on('click', onClick);
            scope.$on('$destroy', () => element.off('click', onClick));
        }
    };
}
export default addVpn;
