import React from 'react';
import PropTypes from 'prop-types';
import { Input, Icon } from 'react-components';
import creditCardType from 'credit-card-type';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { isNumber } from 'proton-shared/lib/helpers/validators';

const banks = require.context('design-system/assets/img/shared/bank-icons', true, /.svg$/);

const banksMap = banks.keys().reduce((acc, key) => {
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

const isValidNumber = (v) => !v || isNumber(v);

const withGaps = (value = '', gaps = []) => {
    return [...value].reduce((acc, digit, index) => {
        if (gaps.includes(index)) {
            return `${acc} ${digit}`;
        }
        return `${acc}${digit}`;
    }, '');
};

const CardNumberInput = ({ value, onChange, errors = [], ...rest }) => {
    const [{ type = '', niceType = '', gaps = [] } = {}] = creditCardType(value) || [];
    const bankIcon = getBankSvg(type);
    const valueWithGaps = gaps.length ? withGaps(value, gaps) : value;

    const handleChange = ({ target }) => {
        const val = target.value.replace(/\s/g, '');
        isValidNumber(val) && onChange(val);
    };

    return (
        <Input
            autoComplete="cc-number"
            name="cardnumber"
            placeholder="0000 0000 0000 0000"
            maxLength={23}
            errors={errors}
            onChange={handleChange}
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

CardNumberInput.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    errors: PropTypes.array,
};

export default CardNumberInput;
