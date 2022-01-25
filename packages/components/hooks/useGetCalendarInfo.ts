import { GetCalendarInfo } from '@proton/shared/lib/interfaces/hooks/GetCalendarInfo';
import { useCallback } from 'react';
import getMemberAndAddress, {
    getMemberAndAddressID,
} from '@proton/shared/lib/calendar/integration/getMemberAndAddress';
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

            const [memberID, addressID] = getMemberAndAddressID(getMemberAndAddress(Addresses, Members));

            const { decryptedCalendarKeys, decryptedPassphrase, passphraseID } =
                await getDecryptedPassphraseAndCalendarKeys(calendarID);

            const addressKeys = await getAddressKeys(addressID);

            return {
                memberID,
                addressID,
                addressKeys,
                decryptedCalendarKeys,
                calendarSettings,
                decryptedPassphrase,
                passphraseID,
            };
        },
        [getCalendarBootstrap, getAddresses, getDecryptedPassphraseAndCalendarKeys, getAddressKeys]
    );
};

export default useGetCalendarInfo;
