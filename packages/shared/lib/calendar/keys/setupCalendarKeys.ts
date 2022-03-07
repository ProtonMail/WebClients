import { c } from 'ttag';
import { useGetAddressKeys } from '@proton/components/hooks';
import { Api } from '../../interfaces';
import { Calendar } from '../../interfaces/calendar';
import { setupCalendar } from '../../api/calendars';
import { getPrimaryKey } from '../../keys';
import { generateCalendarKeyPayload, isCalendarSetupData } from '../../keys/calendarKeys';

interface SetupCalendarKeysArgumentsShared {
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    addressID: string;
}

interface SetupCalendarKeyArguments extends SetupCalendarKeysArgumentsShared {
    calendarID: string;
}

interface SetupCalendarKeysArguments extends SetupCalendarKeysArgumentsShared {
    calendars: Calendar[];
}

export const setupCalendarKey = async ({ calendarID, api, addressID, getAddressKeys }: SetupCalendarKeyArguments) => {
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

    return api(setupCalendar(calendarID, calendarKeyPayload));
};

export const setupCalendarKeys = async ({ api, calendars, getAddressKeys, addressID }: SetupCalendarKeysArguments) => {
    return Promise.all(
        calendars.map(async ({ ID: calendarID }) => {
            return setupCalendarKey({ calendarID, api, getAddressKeys, addressID });
        })
    );
};
