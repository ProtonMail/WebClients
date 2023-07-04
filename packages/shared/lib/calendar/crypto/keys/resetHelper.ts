import { c } from 'ttag';

import { useGetAddressKeys, useGetAddresses } from '@proton/components';

import { getSilentApi } from '../../../api/helpers/customConfig';
import getHasSharedCalendars from '../../../calendar/sharing/getHasSharedCalendars';
import { Api } from '../../../interfaces';
import { VisualCalendar } from '../../../interfaces/calendar';
import { CalendarsModel } from '../../../models';
import { loadModels } from '../../../models/helper';
import { getIsOwnedCalendar } from '../../calendar';
import { reactivateCalendarsKeys } from './reactivateCalendarKeys';
import { resetCalendarKeys } from './resetCalendarKeys';

interface ProcessArguments {
    api: Api;
    cache: any;
    getAddresses: ReturnType<typeof useGetAddresses>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    calendarsToReset?: VisualCalendar[];
    calendarsToReactivate?: VisualCalendar[];
    calendarsToClean?: VisualCalendar[];
}

export const process = async ({
    api,
    cache,
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
    await loadModels([CalendarsModel], { api, cache, useCache: false });

    return hasSharedCalendars;
};
