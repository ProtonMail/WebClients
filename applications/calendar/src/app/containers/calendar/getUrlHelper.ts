import { MAXIMUM_DATE_UTC, MINIMUM_DATE_UTC, VIEWS } from 'proton-shared/lib/calendar/constants';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';

const URL_PARAMS_VIEWS_CONVERSION: { [key: string]: VIEWS } = {
    month: VIEWS.MONTH,
    week: VIEWS.WEEK,
    day: VIEWS.DAY,
};
const VIEW_URL_PARAMS_VIEWS_CONVERSION = {
    [VIEWS.YEAR]: 'year',
    [VIEWS.AGENDA]: 'agenda',
    [VIEWS.CUSTOM]: 'custom',
    [VIEWS.MONTH]: 'month',
    [VIEWS.WEEK]: 'week',
    [VIEWS.DAY]: 'day',
};

export const getUrlView = (urlView: string) => {
    const result = URL_PARAMS_VIEWS_CONVERSION[urlView];
    if (result) {
        return result;
    }
};

export const getUrlDate = (urlYear: string, urlMonth: string, urlDay: string) => {
    const year = parseInt(urlYear, 10);
    const month = parseInt(urlMonth, 10);
    const day = parseInt(urlDay, 10);

    if (year >= 0 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const wantedDate = new Date(Date.UTC(year, month - 1, day));
        if (wantedDate >= MINIMUM_DATE_UTC && wantedDate <= MAXIMUM_DATE_UTC) {
            return wantedDate;
        }
    }
};

export const fromUrlParams = (pathname: string) => {
    const [, ...rest] = pathname.split('/');
    return {
        view: getUrlView(rest[0]),
        range: parseInt(rest[4], 10) || undefined,
        date: getUrlDate(rest[1], rest[2], rest[3]),
    };
};

interface ToUrlParamsArguments {
    date: Date;
    defaultDate: Date;
    view: VIEWS;
    defaultView: VIEWS;
    range?: number;
}
export const toUrlParams = ({ date, defaultDate, view, defaultView, range }: ToUrlParamsArguments) => {
    const dateParams =
        !range && isSameDay(date, defaultDate)
            ? undefined
            : [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    const viewParam = !dateParams && view === defaultView ? undefined : VIEW_URL_PARAMS_VIEWS_CONVERSION[view];
    const result = [viewParam, ...(dateParams || []), range];
    return `/${result.filter(Boolean).join('/')}`;
};
