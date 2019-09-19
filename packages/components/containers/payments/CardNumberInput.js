import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Icon, classnames } from 'react-components';
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
    return banksMap[key]();
};

const isValidNumber = (v) => !v || isNumber(v);

const CardNumberInput = ({ value, onChange, errors, ...rest }) => {
    const [{ type = '', niceType = '' } = {}] = creditCardType(value) || [];
    const bankIcon = getBankSvg(type);

    const handleChange = ({ target }) => {
        const val = target.value.replace(/\s/g, '');
        isValidNumber(val) && onChange(val);
    };

    return (
        <div
            className={classnames([
                'relative pm-field-icon-container w100',
                errors.length && 'pm-field-icon-container--invalid'
            ])}
        >
            <Input
                autoComplete="cc-number"
                name="cardnumber"
                placeholder={c('Placeholder').t`Card number`}
                maxLength={23}
                errors={errors}
                onChange={handleChange}
                value={(value.match(/.{1,4}/g) || []).join(' ')}
                {...rest}
            />
            <span className="right-icon absolute flex">
                {value && bankIcon ? (
                    <img src={bankIcon} className="mauto" title={niceType} alt={niceType} width="20" />
                ) : (
                    <Icon className="mauto" name="payments-type-card" />
                )}
            </span>
        </div>
    );
};

CardNumberInput.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    errors: PropTypes.array
};

export default CardNumberInput;
