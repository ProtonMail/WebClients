import { format } from 'date-fns';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

const FORMATS = {
    [VIEWS.DAY]: 'PP',
    [VIEWS.WEEK]: 'PP',
    [VIEWS.MONTH]: 'MMMM yyyy',
    [VIEWS.YEAR]: 'yyyy',
    [VIEWS.AGENDA]: 'MMMM yyyy',
    [VIEWS.CUSTOM]: 'PP',
    [VIEWS.MAIL]: 'PP',
    [VIEWS.DRIVE]: 'PP',
    [VIEWS.SEARCH]: 'PP',
};

const getDateRangeText = (view: VIEWS, range: number, currentDate: Date, dateRange: Date[]) => {
    const formatOptions = { locale: dateLocale };
    const [from, to] = dateRange;

    if (view === VIEWS.WEEK || range > 0) {
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
