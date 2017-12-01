angular.module('proton.payment')
    .factory('giftCodeModel', (CONSTANTS) => {
        const { GIFT_CODE_LENGTH } = CONSTANTS;
        const IS_VALID = /[a-zA-Z0-9]+/g; // Alpha-Numeric
        const CLEANER = /-|\s|\t/g; // Remove space, tab and hyphen
        const cleanCode = (input = '') => input.replace(CLEANER, '');

        function isValid(input) {
            const code = cleanCode(input);

            return code.length === GIFT_CODE_LENGTH && IS_VALID.test(code);
        }

        return { isValid };
    });
