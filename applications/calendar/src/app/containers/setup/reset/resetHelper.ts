import { c } from 'ttag';
import { loadModels } from 'proton-shared/lib/models/helper';
import { CalendarsModel } from 'proton-shared/lib/models';
import { Api } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { useGetAddresses, useGetAddressKeys } from 'react-components';
import { setupCalendarKeys } from './setupCalendarKeys';
import { resetCalendarKeys } from './resetCalendarKeys';
import { reactivateCalendarsKeys } from './reactivateCalendarKeys';

interface ProcessArguments {
    api: Api;
    cache: any;
    call: () => void;
    getAddresses: ReturnType<typeof useGetAddresses>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    calendarsToReset: Calendar[];
    calendarsToReactivate: Calendar[];
    calendarsToSetup: Calendar[];
}

export const process = async ({
    api,
    cache,
    call,
    getAddresses,
    getAddressKeys,
    calendarsToReset,
    calendarsToReactivate,
    calendarsToSetup
}: ProcessArguments) => {
    const addresses = await getAddresses();
    if (!addresses.length) {
        throw new Error(c('Error').t`Please create an address first.`);
    }

    if (calendarsToSetup.length > 0) {
        await setupCalendarKeys({
            api,
            calendars: calendarsToSetup,
            getAddressKeys,
            addresses
        });
    }

    if (calendarsToReset.length > 0) {
        await resetCalendarKeys({
            api,
            calendars: calendarsToReset,
            getAddressKeys,
            addresses
        });
    }

    if (calendarsToReactivate.length > 0) {
        await reactivateCalendarsKeys({
            api,
            calendars: calendarsToReactivate,
            getAddressKeys,
            addresses
        });
    }

    await call();
    // Refresh the calendar model to be able to get the new flags since it's not updated through the event manager
    await loadModels([CalendarsModel], { api, cache, useCache: false });
};
