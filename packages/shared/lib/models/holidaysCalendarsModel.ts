import { getDirectoryCalendars } from '@proton/shared/lib/api/calendars';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';

export const getHolidaysCalendarsModel = (api: Api) => {
    return api<{ Calendars: HolidaysDirectoryCalendar }>(getDirectoryCalendars(CALENDAR_TYPE.HOLIDAYS)).then(
        ({ Calendars }) => {
            return Calendars;
        }
    );
};

export const HolidaysCalendarsModel = {
    key: 'HolidaysCalendars',
    get: getHolidaysCalendarsModel,
};
