import { GetDecryptedPassphraseAndCalendarKeys } from 'proton-shared/lib/interfaces/hooks/GetDecryptedPassphraseAndCalendarKeys';
import { useCallback } from 'react';
import { splitKeys } from 'proton-shared/lib/keys';
import { noop } from 'proton-shared/lib/helpers/function';
import {
    decryptPassphrase,
    getAddressesMembersMap,
    getDecryptedCalendarKeys,
} from 'proton-shared/lib/keys/calendarKeys';
import { Address } from 'proton-shared/lib/interfaces';
import { MemberPassphrase } from 'proton-shared/lib/interfaces/calendar';
import useCache from './useCache';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { getPromiseValue } from './useCachedModelResult';

export const CACHE_KEY = 'CALENDAR_KEYS';

const useGetDecryptedPassphraseAndCalendarKeysRaw = () => {
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarBootstrap = useGetCalendarBootstrap();

    return useCallback(
        async (calendarID) => {
            const [{ Keys = [], Passphrase = {}, Members = [] }, Addresses = []] = await Promise.all([
                getCalendarBootstrap(calendarID),
                getAddresses(),
            ]);

            const getCalendarKeyPassphrase = async (
                MemberPassphrases: MemberPassphrase[] = [],
                addressesMembersMap: { [key: string]: Address } = {}
            ) => {
                // Try to decrypt each passphrase with the address keys belonging to that member until it succeeds.
                // eslint-disable-next-line no-restricted-syntax
                for (const { Passphrase, Signature, MemberID } of MemberPassphrases) {
                    const Address = addressesMembersMap[MemberID];
                    if (!Address) {
                        continue;
                    }
                    const addressKeys = await getAddressKeys(Address.ID);
                    const result = await decryptPassphrase({
                        armoredPassphrase: Passphrase,
                        armoredSignature: Signature,
                        ...splitKeys(addressKeys),
                    }).catch(noop);

                    if (result) {
                        return result;
                    }
                }
            };

            const { ID: PassphraseID, MemberPassphrases } = Passphrase;
            const addressesMembersMap = getAddressesMembersMap(Members, Addresses);
            const decryptedPassphrase = await getCalendarKeyPassphrase(MemberPassphrases, addressesMembersMap);

            if (!decryptedPassphrase) {
                throw new Error('No passphrase');
            }

            return {
                decryptedCalendarKeys: await getDecryptedCalendarKeys(Keys, { [PassphraseID]: decryptedPassphrase }),
                decryptedPassphrase,
                passphraseID: PassphraseID,
            };
        },
        [getAddresses, getAddressKeys, getCalendarBootstrap]
    );
};

export const useGetDecryptedPassphraseAndCalendarKeys = (): GetDecryptedPassphraseAndCalendarKeys => {
    const cache = useCache();
    const miss = useGetDecryptedPassphraseAndCalendarKeysRaw();

    return useCallback(
        (calendarID: string) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            return getPromiseValue(subCache, calendarID, miss);
        },
        [cache, miss]
    );
};
