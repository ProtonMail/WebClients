import { GIFT_CODE_LENGTH } from '../../constants';

/* @ngInject */
function giftCodeModel() {
    const cleanCode = (input = '') => input.replace(/-|\s|\t/g, '');

    function isValid(input) {
        const code = cleanCode(input);
        return code.length === GIFT_CODE_LENGTH && /\w\d+/g.test(code);
    }

    return { isValid };
}
export default giftCodeModel;
