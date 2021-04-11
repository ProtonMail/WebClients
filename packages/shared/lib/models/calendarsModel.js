import { queryCalendars } from '../api/calendars';
import updateCollection from '../helpers/updateCollection';

export const getCalendars = async (api) => {
    const result = await api(queryCalendars());
    return result.Calendars;
};

export const CalendarsModel = {
    key: 'Calendars',
    get: getCalendars,
    update: (model, events) => updateCollection({ model, events, item: ({ Calendar }) => Calendar }),
};
