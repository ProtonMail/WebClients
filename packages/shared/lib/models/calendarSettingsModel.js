import { getCalendarUserSettings } from '../api/calendars';
import updateObject from '../helpers/updateObject';

export const getCalendarUserSettingsModel = (api) => {
    return api(getCalendarUserSettings()).then(({ CalendarUserSettings }) => CalendarUserSettings);
};

export const CalendarUserSettingsModel = {
    key: 'CalendarUserSettings',
    get: getCalendarUserSettingsModel,
    update: updateObject
};
