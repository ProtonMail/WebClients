import { format } from 'date-fns';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM, MAIL, DRIVE } = VIEWS;

const FORMATS = {
    [DAY]: 'PP',
    [WEEK]: 'PP',
    [MONTH]: 'MMMM yyyy',
    [YEAR]: 'yyyy',
    [AGENDA]: 'MMMM yyyy',
    [CUSTOM]: 'PP',
    [MAIL]: 'PP',
    [DRIVE]: 'PP',
};

const getDateRangeText = (view: VIEWS, range: number, currentDate: Date, dateRange: Date[]) => {
    const formatOptions = { locale: dateLocale };
    const [from, to] = dateRange;

    if (view === WEEK || range > 0) {
        if (from.getMonth() === to.getMonth()) {
            const rest = format(from, 'MMMM yyyy', formatOptions);
            return `${rest}`;
        }

        if (from.getFullYear() === to.getFullYear()) {
            const fromString = format(from, 'MMM', formatOptions);
            const toString = format(to, 'MMM', formatOptions);
            const rest = format(from, 'yyyy', formatOptions);
            return `${fromString} – ${toString} ${rest}`;
        }

        const fromString = format(from, 'MMM yyyy', formatOptions);
        const toString = format(to, 'MMM yyyy', formatOptions);
        return `${fromString} – ${toString}`;
    }

    return format(currentDate, FORMATS[view], formatOptions);
};

export default getDateRangeText;
