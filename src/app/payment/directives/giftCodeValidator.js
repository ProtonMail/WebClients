angular.module('proton.payment')
    .directive('giftCodeValidator', (CONSTANTS) => {
        const { GIFT_CODE_LENGTH } = CONSTANTS;
        const IS_VALID = /[A-Z0-9]/g;
        const CLEANER = /-|\s|\t/g;
        const cleanCode = (input = '') => input.toUpperCase().replace(CLEANER, '');

        return {
            restrict: 'A',
            require: 'ngModel',
            link(scope, element, attr, ngModel) {
                ngModel.$validators.giftCode = (input = '') => {
                    const code = cleanCode(input);
                    return code.length === GIFT_CODE_LENGTH && IS_VALID.test(code);
                };
            }
        };
    });
