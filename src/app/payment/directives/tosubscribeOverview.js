angular.module('proton.payment')
    .directive('tosubscribeOverview', () => {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/payment/tosubscribeOverview.tpl.html'
        };
    });
