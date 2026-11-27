import { resetCalendars } from '@proton/shared/lib/api/calendars';
import { generateCalendarKeyPayload } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import { getPrimaryKey } from '@proton/shared/lib/keys/getPrimaryKey';

interface ResetCalendarKeysArguments {
    calendars: VisualCalendar[];
    api: Api;
    getAddressKeys: GetAddressKeys;
}

export const resetCalendarKeys = async ({ calendars, api, getAddressKeys }: ResetCalendarKeysArguments) => {
    const calendarsResult = await Promise.all(
        calendars.map(async ({ Members: [{ AddressID: addressID }] }) => {
            const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
                getPrimaryKey(await getAddressKeys(addressID)) || {};

            if (!primaryAddressKey || !primaryAddressPublicKey) {
                throw new Error('Calendar owner is missing keys');
            }

            return generateCalendarKeyPayload({
                addressID,
                privateKey: primaryAddressKey,
                publicKey: primaryAddressPublicKey,
            });
        })
    );

    const resetPayload = calendars.reduce((acc, { ID: calendarID }, i) => {
        return {
            ...acc,
            [calendarID]: calendarsResult[i],
        };
    }, {});

    return api(
        resetCalendars({
            CalendarKeys: resetPayload,
        })
    );
};
