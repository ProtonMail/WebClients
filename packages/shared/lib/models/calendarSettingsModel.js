import { getCalendarSettings } from '../api/calendarSettings';
import updateObject from '../helpers/updateObject';

export const getCalendarSettingsModel = (api) => {
    return api(getCalendarSettings()).then(({ CalendarUserSettings }) => CalendarUserSettings);
};

export const handleCalendarSettingsEvents = updateObject;

export const CalendarSettingsModel = {
    key: 'CalendarUserSettings',
    get: getCalendarSettingsModel,
    update: updateObject
};
