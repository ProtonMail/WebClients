import creditCardType from 'credit-card-type';
import { isNumber } from '@proton/shared/lib/helpers/validators';

import Input, { InputTwoProps } from '../../components/v2/input/Input';
import { Icon } from '../../components';

const banks = require.context('@proton/styles/assets/img/credit-card-icons', true, /.svg$/);

const banksMap = banks.keys().reduce<{ [key: string]: () => string }>((acc, key) => {
    acc[key] = () => banks(key);
    return acc;
}, {});

const getBankSvg = (type = '') => {
    const key = `./cc-${type}.svg`;

    if (!banksMap[key]) {
        return;
    }

    return banksMap[key]();
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

interface Props extends Omit<InputTwoProps, 'value' | 'onChange' | 'onValue'> {
    value: string;
    onChange: (value: string) => void;
}

const CardNumberInput = ({ value, onChange, ...rest }: Props) => {
    const [firstCreditCardType] = creditCardType(value);
    const { type = '', niceType = '', gaps = [] } = firstCreditCardType || {};
    const bankIcon = getBankSvg(type);
    const valueWithGaps = gaps.length ? withGaps(value, gaps) : value;

    return (
        <Input
            autoComplete="cc-number"
            name="cardnumber"
            placeholder="0000 0000 0000 0000"
            maxLength={23}
            className="pl0"
            onChange={({ target }) => {
                const val = target.value.replace(/\s/g, '');
                if (isValidNumber(val)) {
                    onChange(val);
                }
            }}
            value={valueWithGaps}
            prefix={
                value && bankIcon ? (
                    <img src={bankIcon} title={niceType} alt={niceType} width="20" />
                ) : (
                    <Icon name="credit-card" />
                )
            }
            {...rest}
        />
    );
};

export default CardNumberInput;
