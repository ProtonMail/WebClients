import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';

import { resetCalendars } from '../../../api/calendars';
import type { Api } from '../../../interfaces';
import type { VisualCalendar } from '../../../interfaces/calendar';
import { getPrimaryKey } from '../../../keys';
import { generateCalendarKeyPayload } from './calendarKeys';

interface ResetCalendarKeysArguments {
    calendars: VisualCalendar[];
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
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
