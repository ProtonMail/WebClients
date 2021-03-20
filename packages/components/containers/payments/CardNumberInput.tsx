import React from 'react';
import creditCardType from 'credit-card-type';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { isNumber } from 'proton-shared/lib/helpers/validators';

import Input, { Props as InputProps } from '../../components/input/Input';
import { Icon } from '../../components';

const banks = require.context('design-system/assets/img/shared/bank-icons', true, /.svg$/);

const banksMap = banks.keys().reduce<{ [key: string]: () => { default: string } }>((acc, key) => {
    acc[key] = () => banks(key);
    return acc;
}, {});

const getBankSvg = (type = '') => {
    const key = `./cc-${type}.svg`;
    const keyDark = `./cc-${type}-dark.svg`;
    if (!banksMap[key]) {
        return;
    }
    const ligthLogo = banksMap[key]().default;
    const darkLogo = !banksMap[keyDark] ? ligthLogo : banksMap[keyDark]().default;

    return getLightOrDark(ligthLogo, darkLogo);
};

const isValidNumber = (v: string) => !v || isNumber(v);

const withGaps = (value = '', gaps: number[] = []) => {
    return [...value].reduce((acc, digit, index) => {
        if (gaps.includes(index)) {
            return `${acc} ${digit}`;
        }
        return `${acc}${digit}`;
    }, '');
};

interface Props extends Omit<InputProps, 'value' | 'onChange'> {
    value: string;
    onChange: (value: string) => void;
}

const CardNumberInput = ({ value, onChange, ...rest }: Props) => {
    const [firstCreditCardType] = creditCardType(value);
    const { type = '', niceType = '', gaps = [] } = firstCreditCardType;
    const bankIcon = getBankSvg(type);
    const valueWithGaps = gaps.length ? withGaps(value, gaps) : value;

    return (
        <Input
            autoComplete="cc-number"
            name="cardnumber"
            placeholder="0000 0000 0000 0000"
            maxLength={23}
            onChange={({ target }) => {
                const val = target.value.replace(/\s/g, '');
                if (isValidNumber(val)) {
                    onChange(val);
                }
            }}
            value={valueWithGaps}
            icon={
                value && bankIcon ? (
                    <img src={bankIcon} className="mauto" title={niceType} alt={niceType} width="20" />
                ) : (
                    <Icon className="mauto" name="payments-type-card" />
                )
            }
            {...rest}
        />
    );
};

export default CardNumberInput;
