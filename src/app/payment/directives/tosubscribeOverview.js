angular.module('proton.payment')
    .directive('tosubscribeOverview', () => {

        return {
            replace: true,
            templateUrl: 'templates/payment/tosubscribeOverview.tpl.html'
        };
    });
