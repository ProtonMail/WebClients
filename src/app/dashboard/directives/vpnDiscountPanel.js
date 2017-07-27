angular.module('proton.dashboard')
    .directive('vpnDiscountPanel', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/vpnDiscountPanel.tpl.html'
        };
    });
