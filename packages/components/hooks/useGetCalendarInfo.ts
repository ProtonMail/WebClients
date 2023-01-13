import { useCallback } from 'react';

import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import { GetCalendarInfo } from '@proton/shared/lib/interfaces/hooks/GetCalendarInfo';

import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { useGetDecryptedPassphraseAndCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';

export const useGetCalendarInfo = (): GetCalendarInfo => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getDecryptedPassphraseAndCalendarKeys = useGetDecryptedPassphraseAndCalendarKeys();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (calendarID: string) => {
            const [{ Members, CalendarSettings: calendarSettings }, Addresses] = await Promise.all([
                getCalendarBootstrap(calendarID),
                getAddresses(),
            ]);

            const [{ ID: memberID }, { ID: addressID }] = getMemberAndAddress(Addresses, Members);

            const [{ decryptedCalendarKeys, decryptedPassphrase, passphraseID }, addressKeys] = await Promise.all([
                getDecryptedPassphraseAndCalendarKeys(calendarID),
                getAddressKeys(addressID),
            ]);

            return {
                memberID,
                addressID,
                addressKeys,
                calendarKeys: decryptedCalendarKeys,
                calendarSettings,
                passphrase: decryptedPassphrase,
                passphraseID,
            };
        },
        [getCalendarBootstrap, getAddresses, getDecryptedPassphraseAndCalendarKeys, getAddressKeys]
    );
};

export default useGetCalendarInfo;
