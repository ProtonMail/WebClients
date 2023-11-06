import { isNumber } from '@proton/shared/lib/helpers/validators';

const isValidMonth = (m: string) => !m || (isNumber(m) && m.length <= 2);
const isValidYear = (y: string) => !y || (isNumber(y) && y.length <= 4);

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
