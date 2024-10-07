import { c } from 'ttag';

import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';

import { createCalendar, updateCalendarUserSettings } from '../../../api/calendars';
import { getRandomAccentColor } from '../../../colors';
import { getTimezone } from '../../../date/timezone';
import { getActiveAddresses } from '../../../helpers/address';
import type { Address, Api } from '../../../interfaces';
import type { CalendarWithOwnMembers } from '../../../interfaces/calendar';
import { getPrimaryKey } from '../../../keys';
import { DEFAULT_CALENDAR } from '../../constants';
import { setupCalendarKey } from './setupCalendarKeys';

interface Args {
    addresses: Address[];
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}

const setupCalendarHelper = async ({ addresses, api, getAddressKeys }: Args) => {
    const activeAddresses = getActiveAddresses(addresses);
    if (!activeAddresses.length) {
        throw new Error(c('Error').t`No valid address found`);
    }

    const [{ ID: addressID }] = activeAddresses;
    const { privateKey: primaryAddressKey } = getPrimaryKey(await getAddressKeys(addressID)) || {};
    if (!primaryAddressKey) {
        throw new Error(c('Error').t`Primary address key is not decrypted.`);
    }

    const { Calendar } = await api<{ Calendar: CalendarWithOwnMembers }>(
        createCalendar({
            Name: DEFAULT_CALENDAR.name,
            Color: getRandomAccentColor(),
            Description: DEFAULT_CALENDAR.description,
            Display: 1,
            AddressID: addressID,
        })
    );
    const updatedCalendarUserSettings = {
        PrimaryTimezone: getTimezone(),
        AutoDetectPrimaryTimezone: 1,
    };

    const [
        {
            Passphrase: { Flags },
        },
    ] = await Promise.all([
        setupCalendarKey({
            api,
            calendarID: Calendar.ID,
            addressID,
            getAddressKeys,
        }),
        api(updateCalendarUserSettings(updatedCalendarUserSettings)),
    ]);

    // There is only one member in the calendar at this point
    const calendarWithUpdatedFlags = {
        ...Calendar,
        Members: [
            {
                ...Calendar.Members[0],
                Flags,
            },
        ],
    };

    return {
        calendar: calendarWithUpdatedFlags,
        updatedCalendarUserSettings,
    };
};

export default setupCalendarHelper;
