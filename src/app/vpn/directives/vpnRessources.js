angular.module('proton.vpn')
.directive('vpnRessources', ($rootScope, $state, CONSTANTS, authentication) => {
    return {
        scope: {},
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/vpn/vpnRessources.tpl.html'
    };
});
