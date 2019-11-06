import { useGetAddresses, useGetAddressKeys, useGetCalendarBootstrap } from 'react-components';
import { useCallback } from 'react';
import { getPersonalPartMap, readPersonalPart } from 'proton-shared/lib/calendar/deserialize';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { getAddressesMembersMap } from 'proton-shared/lib/keys/calendarKeys';

const useGetCalendarEventPersonal = () => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (Event) => {
            const [Addresses, { Members }] = await Promise.all([
                getAddresses(),
                getCalendarBootstrap(Event.CalendarID)
            ]);

            const addressesMembersMap = getAddressesMembersMap(Members, Addresses);
            const personalPartMap = getPersonalPartMap(Event);
            const personalPartMapKeys = Object.keys(personalPartMap);
            const result = await Promise.all(
                personalPartMapKeys.map(async (memberID) => {
                    const { ID: addressID } = addressesMembersMap[memberID] || {};
                    if (!addressID) {
                        return new Error('Non-existing address');
                    }
                    const personalPart = personalPartMap[memberID];
                    const addressKeys = await getAddressKeys(addressID);
                    return readPersonalPart(personalPart, splitKeys(addressKeys).publicKeys).catch((e) => e);
                })
            );

            return personalPartMapKeys.reduce((acc, memberID, i) => {
                acc[memberID] = result[i];
                return acc;
            }, {});
        },
        [getAddresses, getAddressKeys, getCalendarBootstrap]
    );
};

export default useGetCalendarEventPersonal;
