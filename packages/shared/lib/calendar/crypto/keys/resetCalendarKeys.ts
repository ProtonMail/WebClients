import { useGetAddressKeys } from '@proton/components';

import { resetCalendars } from '../../../api/calendars';
import { Address, Api } from '../../../interfaces';
import { VisualCalendar } from '../../../interfaces/calendar';
import { getPrimaryKey } from '../../../keys';
import { getMemberAddressWithAdminPermissions } from '../../getMemberWithAdmin';
import { generateCalendarKeyPayload } from './calendarKeys';

interface ResetCalendarKeysArguments {
    calendars: VisualCalendar[];
    addresses: Address[];
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}

export const resetCalendarKeys = async ({ calendars, addresses, api, getAddressKeys }: ResetCalendarKeysArguments) => {
    const calendarsResult = await Promise.all(
        calendars.map(async ({ Members }) => {
            const { Address: selfAddress } = getMemberAddressWithAdminPermissions(Members, addresses);
            const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
                getPrimaryKey(await getAddressKeys(selfAddress.ID)) || {};

            if (!primaryAddressKey || !primaryAddressPublicKey) {
                throw new Error('Calendar owner is missing keys');
            }

            return generateCalendarKeyPayload({
                addressID: selfAddress.ID,
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
