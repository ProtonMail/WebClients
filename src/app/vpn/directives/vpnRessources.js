angular.module('proton.vpn')
.directive('vpnRessources', () => {
    return {
        scope: {},
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/vpn/vpnRessources.tpl.html'
    };
});
