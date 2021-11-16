import { c } from 'ttag';
import { useGetAddressKeys } from '@proton/components';
import { setupCalendarKey } from './setupCalendarKeys';
import { Address, Api } from '../../interfaces';
import { createCalendar, updateCalendarUserSettings } from '../../api/calendars';
import { Calendar as tsCalendar } from '../../interfaces/calendar';
import { getTimezone } from '../../date/timezone';
import { getPrimaryKey } from '../../keys';

import { getActiveAddresses } from '../../helpers/address';
import { DEFAULT_CALENDAR } from '../constants';
import { LABEL_COLORS } from '../../constants';
import { randomIntFromInterval } from '../../helpers/function';

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
    const updatedCalendarUserSettings = {
        PrimaryTimezone: getTimezone(),
        AutoDetectPrimaryTimezone: 1,
    };

    await Promise.all([
        api(updateCalendarUserSettings(updatedCalendarUserSettings)),
        setupCalendarKey({
            api,
            calendarID: Calendar.ID,
            addresses: activeAddresses,
            getAddressKeys,
        }),
    ]);

    return {
        calendar: Calendar,
        updatedCalendarUserSettings,
    };
};

export default setupCalendarHelper;
