import creditCardType from 'credit-card-type';

import { isNumber } from '@proton/shared/lib/helpers/validators';

import { getBankSvg } from '../../helpers/credit-card-icons';

export const isValidNumber = (v: string) => !v || isNumber(v);

const withGaps = (value = '', gaps: number[] = []) => {
    return [...value].reduce((acc, digit, index) => {
        if (gaps.includes(index)) {
            return `${acc} ${digit}`;
        }
        return `${acc}${digit}`;
    }, '');
};

export const formatCreditCardNumber = (value: string) => {
    const [firstCreditCardType] = creditCardType(value);
    const { type = '', niceType = '', gaps = [], code } = firstCreditCardType || {};
    const bankIcon = getBankSvg(type);
    const valueWithGaps = gaps.length ? withGaps(value, gaps) : value;

    return {
        valueWithGaps,
        bankIcon,
        niceType,
        codeName: code?.name ?? 'CVV',
    };
};
