import { joinHolidaysCalendar } from '../../../api/calendars';
import { Address, Api } from '../../../interfaces';
import {
    CalendarNotificationSettings,
    HolidaysDirectoryCalendar,
    JoinHolidayCalendarResponse,
} from '../../../interfaces/calendar';
import { GetAddressKeys } from '../../../interfaces/hooks/GetAddressKeys';
import { getJoinHolidaysCalendarData } from '../../holidaysCalendar/holidaysCalendar';

interface Props {
    holidaysCalendar: HolidaysDirectoryCalendar;
    color: string;
    notifications: CalendarNotificationSettings[];
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    priority?: number;
    api: Api;
}
const setupHolidaysCalendarHelper = async ({
    holidaysCalendar,
    color,
    notifications,
    addresses,
    getAddressKeys,
    priority,
    api,
}: Props) => {
    const { calendarID, addressID, payload } = await getJoinHolidaysCalendarData({
        holidaysCalendar,
        addresses,
        getAddressKeys,
        color,
        notifications,
        priority,
    });
    return api<JoinHolidayCalendarResponse>(joinHolidaysCalendar(calendarID, addressID, payload));
};

export default setupHolidaysCalendarHelper;
