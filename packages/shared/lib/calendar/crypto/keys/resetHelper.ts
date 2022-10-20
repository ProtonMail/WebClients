import { c } from 'ttag';

import { useGetAddressKeys, useGetAddresses } from '@proton/components';

import { Api } from '../../../interfaces';
import { VisualCalendar } from '../../../interfaces/calendar';
import { CalendarsModel } from '../../../models';
import { loadModels } from '../../../models/helper';
import { reactivateCalendarsKeys } from './reactivateCalendarKeys';
import { resetCalendarKeys } from './resetCalendarKeys';

interface ProcessArguments {
    api: Api;
    cache: any;
    getAddresses: ReturnType<typeof useGetAddresses>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    calendarsToReset: VisualCalendar[];
    calendarsToReactivate: VisualCalendar[];
}

export const process = async ({
    api,
    cache,
    getAddresses,
    getAddressKeys,
    calendarsToReset,
    calendarsToReactivate,
}: ProcessArguments) => {
    const addresses = await getAddresses();
    if (!addresses.length) {
        throw new Error(c('Error').t`Please create an address first.`);
    }

    if (calendarsToReset.length > 0) {
        await resetCalendarKeys({
            calendars: calendarsToReset,
            addresses,
            api,
            getAddressKeys,
        });
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
};
