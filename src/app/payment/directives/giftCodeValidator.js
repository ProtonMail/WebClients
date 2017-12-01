angular.module('proton.payment')
    .directive('giftCodeValidator', (giftCodeModel) => {
        return {
            restrict: 'A',
            require: 'ngModel',
            link(scope, element, attr, ngModel) {
                ngModel.$validators.giftCode = (input = '') => giftCodeModel.isValid(input);
            }
        };
    });
