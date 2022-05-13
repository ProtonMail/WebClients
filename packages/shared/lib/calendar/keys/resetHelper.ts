import { c } from 'ttag';
import { useGetAddresses, useGetAddressKeys } from '@proton/components';
import { loadModels } from '../../models/helper';
import { CalendarsModel } from '../../models';
import { Api } from '../../interfaces';
import { Calendar } from '../../interfaces/calendar';
import { resetCalendarKeys } from './resetCalendarKeys';
import { reactivateCalendarsKeys } from './reactivateCalendarKeys';

interface ProcessArguments {
    api: Api;
    cache: any;
    getAddresses: ReturnType<typeof useGetAddresses>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    calendarsToReset: Calendar[];
    calendarsToReactivate: Calendar[];
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
            api,
            getAddressKeys,
            addresses,
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
