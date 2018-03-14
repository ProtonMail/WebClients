/* @ngInject */
function vpnView($rootScope, $state, addressesModel, CONSTANTS, authentication) {
    const vpnStatus = () => {
        const { Status = 0 } = authentication.user.VPN;
        return Status;
    };
    const getFirstEmail = () => {
        const addresses = addressesModel.get();
        return addresses.length ? addresses[0].Email : '';
    };
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/vpn/vpnView.tpl.html'),
        link(scope) {
            const unsubscribes = [];
            const update = () => {
                scope.VPNLogin = getFirstEmail();
                scope.vpnEnabled = vpnStatus();
            };

            unsubscribes.push($rootScope.$on('updateUser', () => update()));

            scope.$on('$destroy', () => {
                unsubscribes.forEach((callback) => callback());
                unsubscribes.length = 0;
            });

            update();
        }
    };
}
export default vpnView;
