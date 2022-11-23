import { queryCalendars } from '../api/calendars';
import updateCollection from '../helpers/updateCollection';

export const CALENDARS_CACHE_KEY = 'Calendars';

export const getCalendars = async (api) => {
    const result = await api(queryCalendars());
    return result.Calendars;
};

export const CalendarsModel = {
    key: CALENDARS_CACHE_KEY,
    get: getCalendars,
    update: (model, events) => {
        updateCollection({ model, events, itemKey: 'Calendar' });
    },
};
