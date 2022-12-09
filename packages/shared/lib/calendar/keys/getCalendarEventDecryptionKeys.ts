import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';

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
    const { CalendarID } = calendarEvent;
    if (getIsAutoAddedInvite(calendarEvent)) {
        if (!addressKeys && !getAddressKeys) {
            return;
        }
        return splitKeys(addressKeys || (await getAddressKeys?.(calendarEvent.AddressID))).privateKeys;
    }
    if (!calendarKeys && !getCalendarKeys) {
        return;
    }
    return splitKeys(calendarKeys || (await getCalendarKeys?.(CalendarID))).privateKeys;
};
