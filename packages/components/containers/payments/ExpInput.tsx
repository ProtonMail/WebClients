import React from 'react';
import { isNumber } from 'proton-shared/lib/helpers/validators';

import Input, { Props as InputProps } from '../../components/input/Input';

const isValidMonth = (m: string) => !m || (isNumber(m) && m.length <= 2);
const isValidYear = (y: string) => !y || (isNumber(y) && y.length <= 4);

interface Props extends Omit<InputProps, 'onChange'> {
    month: string;
    year: string;
    onChange: (value: { month: string; year: string }) => void;
}

const ExpInput = ({ month, year, onChange, ...rest }: Props) => {
    return (
        <Input
            value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
            autoComplete="cc-exp"
            maxLength={5}
            placeholder="MM/YY"
            onChange={({ target }) => {
                const [newMonth = '', newYear = ''] = target.value.split('/');

                if (target.value.includes('/')) {
                    onChange({
                        month: isValidMonth(newMonth) ? newMonth : month,
                        year: isValidYear(newYear) ? newYear : year,
                    });
                    return;
                }

                if (newMonth.length > 2) {
                    // User removes the '/'
                    return;
                }

                if (month.length === 2) {
                    // User removes the '/' and year is empty
                    const [first = ''] = newMonth;
                    onChange({
                        year: '',
                        month: isValidMonth(first) ? first : month,
                    });
                    return;
                }

                const [first = '', second = ''] = newMonth;
                onChange({
                    year: '',
                    month: isValidMonth(`${first}${second}`) ? `${first}${second}` : month,
                });
            }}
            {...rest}
        />
    );
};

export default ExpInput;
