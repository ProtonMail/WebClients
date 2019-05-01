import { GIFT_CODE_LENGTH } from '../constants';

export const clean = (code = '') => code.replace(/-|\s|\t/g, '');

export const isValid = (input = '') => {
    const code = clean(input);
    return code.length === GIFT_CODE_LENGTH && /\w\d+/g.test(code);
};
