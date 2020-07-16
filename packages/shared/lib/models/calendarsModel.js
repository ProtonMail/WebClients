import { queryCalendars } from '../api/calendars';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';
import updateCollection from '../helpers/updateCollection';

export const getCalendars = (api) => {
    const pageSize = 150;

    const requestPage = (Page) =>
        api(
            queryCalendars({
                Page,
                PageSize: pageSize,
            })
        );

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Calendars }) => Calendars).flat();
    });
};

export const CalendarsModel = {
    key: 'Calendars',
    get: getCalendars,
    update: (model, events) => updateCollection({ model, events, item: ({ Calendar }) => Calendar }),
};
