import {
    useGetAddresses,
    useGetAddressKeys,
    useGetCalendarBootstrap,
    useGetCalendarKeys,
    useGetPublicKeys
} from 'react-components';
import { useCallback } from 'react';
import { readCalendarEvent, readSessionKeys } from 'proton-shared/lib/calendar/deserialize';
import { splitKeys } from 'proton-shared/lib/keys/keys';

const useGetCalendarEventRaw = () => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getCalendarKeys = useGetCalendarKeys();
    const getPublicKeys = useGetPublicKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (Event) => {
            const getAuthorPublicKeys = async () => {
                const addresses = await getAddresses();
                const ownAddress = addresses.find(({ Email }) => Email === Event.Author);

                if (ownAddress) {
                    const result = await getAddressKeys(ownAddress.ID);
                    return splitKeys(result, false).publicKeys;
                }

                const { publicKeys = [] } = await getPublicKeys(Event.Author);
                return publicKeys;
            };

            const [calendarKeys, authorPublicKeys] = await Promise.all([
                getCalendarKeys(Event.CalendarID),
                getAuthorPublicKeys(Event.Author)
            ]);
            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys(
                Event,
                splitKeys(calendarKeys).privateKeys
            );
            return readCalendarEvent({
                event: Event,
                publicKeys: authorPublicKeys,
                sharedSessionKey,
                calendarSessionKey
            });
        },
        [getAddresses, getAddressKeys, getCalendarBootstrap, getCalendarKeys, getPublicKeys]
    );
};

export default useGetCalendarEventRaw;
