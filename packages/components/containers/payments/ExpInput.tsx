import { Input, InputProps } from '@proton/atoms';
import { isNumber } from '@proton/shared/lib/helpers/validators';

const isValidMonth = (m: string) => !m || (isNumber(m) && m.length <= 2);
const isValidYear = (y: string) => !y || (isNumber(y) && y.length <= 4);

interface Props extends Omit<InputProps, 'onChange' | 'onValue'> {
    month: string;
    year: string;
    onChange: (value: { month: string; year: string }) => void;
}

export const handleExpOnChange = (newValue: string, prevMonth: string, prevYear: string) => {
    const [newMonth = '', newYear = ''] = newValue.split('/');

    if (newValue.includes('/')) {
        return {
            month: isValidMonth(newMonth) ? newMonth : prevMonth,
            year: isValidYear(newYear) ? newYear : prevYear,
        };
    }

    if (newMonth.length > 2) {
        // User removes the '/'
        return;
    }

    if (prevMonth.length === 2) {
        // User removes the '/' and year is empty
        const [first = ''] = newMonth;
        return {
            year: '',
            month: isValidMonth(first) ? first : prevMonth,
        };
    }

    const [first = '', second = ''] = newMonth;
    return {
        year: '',
        month: isValidMonth(`${first}${second}`) ? `${first}${second}` : prevMonth,
    };
};

const ExpInput = ({ month, year, onChange, ...rest }: Props) => {
    return (
        <Input
            value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
            autoComplete="cc-exp"
            maxLength={5}
            onChange={({ target }) => {
                const change = handleExpOnChange(target.value, month, year);
                if (change) {
                    onChange(change);
                }
            }}
            {...rest}
        />
    );
};

export default ExpInput;
