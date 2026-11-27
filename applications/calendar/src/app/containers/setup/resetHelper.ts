import { c } from 'ttag';

import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import { reactivateCalendarsKeys } from '@proton/shared/lib/calendar/crypto/keys/reactivateCalendarKeys';
import getHasSharedCalendars from '@proton/shared/lib/calendar/sharing/getHasSharedCalendars';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetAddresses } from '@proton/shared/lib/interfaces/hooks/GetAddresses';
import type { GetCalendarBootstrap } from '@proton/shared/lib/interfaces/hooks/GetCalendarBootstrap';

import type { GetCalendars } from '../../interfaces/GetCalendars';
import { resetCalendarKeys } from './resetCalendarKeys';

interface ProcessArguments {
    api: Api;
    getCalendars: GetCalendars;
    getAddresses: GetAddresses;
    getAddressKeys: GetAddressKeys;
    getCalendarBootstrap: GetCalendarBootstrap;
    calendarsToReset?: VisualCalendar[];
    calendarsToReactivate?: VisualCalendar[];
    calendarsToClean?: VisualCalendar[];
}

export const process = async ({
    api,
    getCalendars,
    getCalendarBootstrap,
    getAddresses,
    getAddressKeys,
    calendarsToReset = [],
    calendarsToReactivate = [],
    calendarsToClean = [],
}: ProcessArguments) => {
    const addresses = await getAddresses();

    if (!addresses.length) {
        throw new Error(c('Error').t`Please create an address first.`);
    }

    let hasSharedCalendars = false;
    if (calendarsToReset.length > 0 || calendarsToClean.length > 0) {
        // Non-owners can't reset calendar keys
        // Even if calendarsToReset is empty, we want to call the reset endpoint in order to clean shared/holidays calendars
        const calendars = calendarsToReset.filter((calendar) => getIsOwnedCalendar(calendar));
        const [hasShared] = await Promise.all([
            getHasSharedCalendars({
                calendars,
                api: getSilentApi(api),
                catchErrors: true,
            }),
            resetCalendarKeys({
                calendars,
                api,
                getAddressKeys,
            }),
        ]);

        hasSharedCalendars = hasShared;
    }

    if (calendarsToReactivate.length > 0) {
        await reactivateCalendarsKeys({
            api,
            calendars: calendarsToReactivate,
            getAddressKeys,
            addresses,
        });
    }

    // Refresh the calendar model to be able to get the new flags since it's not updated through the event manager
    const calendars = await getCalendars({ cache: CacheType.None });
    await Promise.all(calendars.map((calendar) => getCalendarBootstrap(calendar.ID, CacheType.None)));

    return hasSharedCalendars;
};
