import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Icon } from 'react-components';
import creditCardType from 'credit-card-type';
import { isNumber } from 'proton-shared/lib/helpers/validators';

const banks = require.context('design-system/assets/img/shared/bank-icons', true, /.svg$/);

const banksMap = banks.keys().reduce((acc, key) => {
    acc[key] = () => banks(key);
    return acc;
}, {});

const getBankSvg = (type = '') => {
    const key = `./cc-${type}.svg`;
    if (!banksMap[key]) {
        return;
    }
    return banksMap[key]().default;
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
            placeholder={c('Placeholder').t`Card number`}
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
    errors: PropTypes.array
};

export default CardNumberInput;
