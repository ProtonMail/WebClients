import { c } from 'ttag';
import { useGetAddressKeys } from '@proton/components';
import { Address, Api } from '@proton/shared/lib/interfaces';
import { createCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { Calendar as tsCalendar } from '@proton/shared/lib/interfaces/calendar';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { DEFAULT_CALENDAR } from '@proton/shared/lib/calendar/constants';
import { setupCalendarKey } from '@proton/components/containers/keys/calendar';
import { LABEL_COLORS } from '@proton/shared/lib/constants';
import { randomIntFromInterval } from '@proton/shared/lib/helpers/function';

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

    const { Calendar } = await api<{ Calendar: tsCalendar }>(
        createCalendar({
            Name: DEFAULT_CALENDAR.name,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Description: DEFAULT_CALENDAR.description,
            Display: 1,
            AddressID: addressID,
        })
    );

    await Promise.all([
        api(
            updateCalendarUserSettings({
                PrimaryTimezone: getTimezone(),
                AutoDetectPrimaryTimezone: 1,
            })
        ),
        setupCalendarKey({
            api,
            calendarID: Calendar.ID,
            addresses: activeAddresses,
            getAddressKeys,
        }),
    ]);
};

export default setupCalendarHelper;
