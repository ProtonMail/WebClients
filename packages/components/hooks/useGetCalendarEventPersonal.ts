import { useCallback } from 'react';
import { getPersonalPartMap, readPersonalPart } from 'proton-shared/lib/calendar/deserialize';
import { splitKeys } from 'proton-shared/lib/keys';
import { getAddressesMembersMap } from 'proton-shared/lib/keys/calendarKeys';
import {
    CalendarEvent,
    DecryptedPersonalVeventMapResult,
    DecryptedVeventResult,
} from 'proton-shared/lib/interfaces/calendar';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';

const useGetCalendarEventPersonal = () => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (Event: CalendarEvent) => {
            const [Addresses, { Members }] = await Promise.all([
                getAddresses(),
                getCalendarBootstrap(Event.CalendarID),
            ]);

            const addressesMembersMap = getAddressesMembersMap(Members, Addresses);
            const personalPartMap = getPersonalPartMap(Event);
            const personalPartMapKeys = Object.keys(personalPartMap);
            const result: DecryptedVeventResult[] = await Promise.all(
                personalPartMapKeys.map(async (memberID) => {
                    const { ID: addressID } = addressesMembersMap[memberID] || {};
                    if (!addressID) {
                        return undefined;
                    }
                    const personalPart = personalPartMap[memberID];
                    const addressKeys = await getAddressKeys(addressID);
                    return readPersonalPart(personalPart, splitKeys(addressKeys).publicKeys).catch((e) => e);
                })
            );

            return personalPartMapKeys.reduce<DecryptedPersonalVeventMapResult>((acc, memberID, i) => {
                acc[memberID] = result[i];
                return acc;
            }, {});
        },
        [getAddresses, getAddressKeys, getCalendarBootstrap]
    );
};

export default useGetCalendarEventPersonal;
