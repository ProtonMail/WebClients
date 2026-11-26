import { updateCalendarSettings } from '@proton/shared/lib/api/calendars';
import type { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';
import setupHolidaysCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupHolidaysCalendarHelper';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { JoinHolidayCalendarResponse } from '@proton/shared/lib/interfaces/calendar/Api';
import type {
    CalendarNotificationSettings,
    HolidaysDirectoryCalendar,
} from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';

interface Options {
    holidaysCalendar: HolidaysDirectoryCalendar;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    color: string;
    notifications: CalendarNotificationSettings[];
    makesUserBusy: CALENDAR_SHARE_BUSY_TIME_SLOTS;
    api: Api;
    /** Called once the calendar exists, before the settings call that can still fail */
    onJoined?: () => void;
}

/** Joins a holidays directory calendar, then applies the busy setting. Callers refresh the event loop themselves. */
const joinHolidaysCalendar = async ({
    holidaysCalendar,
    addresses,
    getAddressKeys,
    color,
    notifications,
    makesUserBusy,
    api,
    onJoined,
}: Options): Promise<JoinHolidayCalendarResponse> => {
    const response = await setupHolidaysCalendarHelper({
        holidaysCalendar,
        addresses,
        getAddressKeys,
        color,
        notifications,
        api,
    });
    onJoined?.();

    // The join route does not accept the busy setting, so it is updated afterwards
    if (makesUserBusy !== response.CalendarSettings.MakesUserBusy) {
        await api(updateCalendarSettings(response.Calendar.ID, { MakesUserBusy: makesUserBusy }));
    }

    return response;
};

export default joinHolidaysCalendar;
