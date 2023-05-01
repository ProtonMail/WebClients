import {joinHolidaysCalendar} from '../../../api/calendars';
import {Address, Api} from '../../../interfaces';
import {CalendarNotificationSettings, HolidaysDirectoryCalendar} from '../../../interfaces/calendar';
import {GetAddressKeys} from '../../../interfaces/hooks/GetAddressKeys';
import {getJoinHolidaysCalendarData} from '../../holidaysCalendar/holidaysCalendar';


interface Props {
    holidaysCalendar: HolidaysDirectoryCalendar;
    color: string;
    notifications: CalendarNotificationSettings[];
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    api: Api;
}
const setupHolidaysCalendarHelper = async ({ holidaysCalendar, color, notifications, addresses, getAddressKeys, api  }: Props) => {
    const { calendarID, addressID, payload } = await getJoinHolidaysCalendarData({
        holidaysCalendar,
        addresses,
        getAddressKeys,
        color,
        notifications,
    });
    return api(joinHolidaysCalendar(calendarID, addressID, payload));
};

export default setupHolidaysCalendarHelper;
