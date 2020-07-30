import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-components';
import { isNumber } from 'proton-shared/lib/helpers/validators';

const isValidMonth = (m) => !m || (isNumber(m) && m.length <= 2);
const isValidYear = (y) => !y || (isNumber(y) && y.length <= 4);

const ExpInput = ({ month, year, onChange, ...rest }) => {
    const handleChange = ({ target }) => {
        const [newMonth = '', newYear = ''] = target.value.split('/');

        if (target.value.includes('/')) {
            onChange({
                month: isValidMonth(newMonth) ? newMonth : month,
                year: isValidYear(newYear) ? newYear : year,
            });
        } else if (newMonth.length > 2) {
            // User removes the '/'
        } else if (month.length === 2) {
            // User removes the '/' and year is empty
            const [first = ''] = newMonth;
            onChange({
                year: '',
                month: isValidMonth(first) ? first : month,
            });
        } else {
            const [first = '', second = ''] = newMonth;
            onChange({
                year: '',
                month: isValidMonth(`${first}${second}`) ? `${first}${second}` : month,
            });
        }
    };

    return (
        <Input
            value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
            autoComplete="cc-exp"
            maxLength={5}
            placeholder="MM/YY"
            onChange={handleChange}
            {...rest}
        />
    );
};

ExpInput.propTypes = {
    month: PropTypes.string,
    year: PropTypes.string,
    onChange: PropTypes.func,
};

export default ExpInput;
