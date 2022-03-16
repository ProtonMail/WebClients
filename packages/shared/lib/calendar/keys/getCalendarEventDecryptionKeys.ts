import { DecryptedKey } from '../../interfaces';
import { CalendarEvent, DecryptedCalendarKey } from '../../interfaces/calendar';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { splitKeys } from '../../keys';

export const getCalendarEventDecryptionKeys = async ({
    calendarEvent,
    addressKeys,
    calendarKeys,
    getAddressKeys,
    getCalendarKeys,
}: {
    calendarEvent: CalendarEvent;
    addressKeys?: DecryptedKey[];
    calendarKeys?: DecryptedCalendarKey[];
    getAddressKeys?: GetAddressKeys;
    getCalendarKeys?: GetCalendarKeys;
}) => {
    const { CalendarID, AddressID, AddressKeyPacket } = calendarEvent;
    if (AddressKeyPacket && AddressID) {
        if (!addressKeys && !getAddressKeys) {
            return;
        }
        return splitKeys(addressKeys || (await getAddressKeys?.(AddressID))).privateKeys;
    }
    if (!calendarKeys && !getCalendarKeys) {
        return;
    }
    return splitKeys(calendarKeys || (await getCalendarKeys?.(CalendarID))).privateKeys;
};
