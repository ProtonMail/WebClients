import { format } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';
import { VIEWS } from 'proton-shared/lib/calendar/constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM } = VIEWS;

const FORMATS = {
    [DAY]: 'PP',
    [WEEK]: 'PP',
    [MONTH]: 'LLL yyyy',
    [YEAR]: 'yyyy',
    [AGENDA]: 'LLL yyyy',
    [CUSTOM]: 'PP',
};

const getDateRangeText = (view: VIEWS, range: number, currentDate: Date, dateRange: Date[]) => {
    const formatOptions = { locale: dateLocale };
    const [from, to] = dateRange;

    if (view === WEEK || range > 0) {
        if (from.getMonth() === to.getMonth()) {
            const fromString = format(from, 'd', formatOptions);
            const toString = format(to, 'd', formatOptions);
            const rest = format(from, 'MMM yyyy', formatOptions);
            return `${fromString} - ${toString} ${rest}`;
        }

        if (from.getFullYear() === to.getFullYear()) {
            const fromString = format(from, 'd MMM', formatOptions);
            const toString = format(to, 'd MMM', formatOptions);
            const rest = format(from, 'yyyy', formatOptions);
            return `${fromString} - ${toString} ${rest}`;
        }

        const fromString = format(from, 'd MMM yyyy', formatOptions);
        const toString = format(to, 'd MMM yyyy', formatOptions);
        return `${fromString} - ${toString}`;
    }

    return format(currentDate, FORMATS[view], formatOptions);
};

export default getDateRangeText;
