import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { CalendarSettings, DecryptedCalendarKey } from 'proton-shared/lib/interfaces/calendar';
import { useCallback } from 'react';
import getMemberAndAddress, { getMemberAndAddressID } from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { useGetDecryptedPassphraseAndCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';

export type GetCalendarInfo = (
    ID: string
) => Promise<{
    memberID: string;
    addressKeys: DecryptedKey[];
    decryptedCalendarKeys: DecryptedCalendarKey[];
    calendarSettings: CalendarSettings;
    decryptedPassphrase: string;
    passphraseID: string;
}>;

export const useGetCalendarInfo = () => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getCalendarKeys = useGetDecryptedPassphraseAndCalendarKeys();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (calendarID: string) => {
            const [{ Members, CalendarSettings: calendarSettings }, Addresses] = await Promise.all([
                getCalendarBootstrap(calendarID),
                getAddresses(),
            ]);

            const [memberID, addressID] = getMemberAndAddressID(getMemberAndAddress(Addresses, Members));

            const { decryptedCalendarKeys, decryptedPassphrase, passphraseID } = await getCalendarKeys(calendarID);

            const addressKeys = await getAddressKeys(addressID);

            return {
                memberID,
                addressKeys,
                decryptedCalendarKeys,
                calendarSettings,
                decryptedPassphrase,
                passphraseID,
            };
        },
        [getCalendarBootstrap, getAddresses, getCalendarKeys, getAddressKeys]
    );
};
