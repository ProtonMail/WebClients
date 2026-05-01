import { c } from 'ttag';

import { CacheType } from '@proton/redux-utilities/interface';

import { getSilentApi } from '../../../api/helpers/customConfig';
import getHasSharedCalendars from '../../../calendar/sharing/getHasSharedCalendars';
import type { Api } from '../../../interfaces';
import type { VisualCalendar } from '../../../interfaces/calendar';
import type { GetAddressKeys } from '../../../interfaces/hooks/GetAddressKeys';
import type { GetAddresses } from '../../../interfaces/hooks/GetAddresses';
import type { GetCalendarBootstrap } from '../../../interfaces/hooks/GetCalendarBootstrap';
import type { GetCalendars } from '../../../interfaces/hooks/GetCalendars';
import { getIsOwnedCalendar } from '../../calendar';
import { reactivateCalendarsKeys } from './reactivateCalendarKeys';
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
