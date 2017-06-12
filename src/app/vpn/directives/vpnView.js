angular.module('proton.vpn')
.directive('vpnView', ($rootScope, $state, CONSTANTS, authentication) => {
    const vpnStatus = () => {
        const { Status = 0 } = authentication.user.VPN;
        return Status;
    };
    const getFirstEmail = () => {
        const { Addresses = [] } = authentication.user;
        return (Addresses.length) ? Addresses[0].Email : '';
    };
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: 'templates/vpn/vpnView.tpl.html',
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
});
