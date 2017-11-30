angular.module('proton.payment')
    .directive('giftCodeInput', () => {
        return {
            replace: true,
            restrict: 'E',
            scope: { form: '=', code: '=' },
            templateUrl: 'templates/payment/giftCodeInput.tpl.html'
        };
    });
