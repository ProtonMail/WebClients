import { useCallback } from 'react';
import getMemberAndAddress, { getMemberAndAddressID } from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { useGetCalendarKeys } from './useGetCalendarKeys';

export const useGetCalendarIdsAndKeys = () => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (calendarID: string) => {
            const [{ Members }, Addresses] = await Promise.all([getCalendarBootstrap(calendarID), getAddresses()]);
            const [memberID, addressID] = getMemberAndAddressID(getMemberAndAddress(Addresses, Members));
            const [addressKeys, calendarKeys] = await Promise.all([
                getAddressKeys(addressID),
                getCalendarKeys(calendarID),
            ]);
            return { memberID, addressKeys, calendarKeys };
        },
        [getCalendarBootstrap, getAddresses, getCalendarKeys, getAddressKeys]
    );
};
