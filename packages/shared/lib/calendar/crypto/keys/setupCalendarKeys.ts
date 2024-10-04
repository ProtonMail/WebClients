import { c } from 'ttag';

import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';

import { setupCalendar } from '../../../api/calendars';
import type { Api } from '../../../interfaces';
import type { CalendarSetupResponse, CalendarWithOwnMembers } from '../../../interfaces/calendar';
import { getPrimaryKey } from '../../../keys';
import { generateCalendarKeyPayload } from './calendarKeys';
import { isCalendarSetupData } from './helpers';

export const setupCalendarKey = async ({
    calendarID,
    api,
    addressID,
    getAddressKeys,
}: {
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    calendarID: string;
    addressID: string;
}) => {
    const { privateKey, publicKey } = getPrimaryKey(await getAddressKeys(addressID)) || {};

    if (!privateKey || !publicKey) {
        throw new Error(c('Error').t`Primary address key is not decrypted`);
    }

    const calendarKeyPayload = await generateCalendarKeyPayload({
        addressID,
        privateKey,
        publicKey,
    });

    if (!isCalendarSetupData(calendarKeyPayload)) {
        throw new Error(c('Error').t`Missing key packet`);
    }

    return api<CalendarSetupResponse>(setupCalendar(calendarID, calendarKeyPayload));
};

export const setupCalendarKeys = async ({
    api,
    calendars,
    getAddressKeys,
}: {
    api: Api;
    calendars: CalendarWithOwnMembers[];
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}) => {
    return Promise.all(
        calendars.map(async ({ ID: calendarID, Members }) => {
            const addressID = Members[0]?.AddressID;
            if (!addressID) {
                return;
            }
            return setupCalendarKey({ calendarID, api, getAddressKeys, addressID });
        })
    );
};
