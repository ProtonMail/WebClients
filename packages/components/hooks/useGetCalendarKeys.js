import { useCallback } from 'react';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { noop } from 'proton-shared/lib/helpers/function';
import { decryptCalendarKeys, decryptPassphrase, getAddressesMembersMap } from 'proton-shared/lib/keys/calendarKeys';
import useCache from '../containers/cache/useCache';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import useGetCalendarBootstrap from './useGetCalendarBootstrap';
import { getPromiseValue } from './useCachedModelResult';

export const CACHE_KEY = 'CALENDAR_KEYS';

const useGetCalendarKeysRaw = () => {
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarBootstrap = useGetCalendarBootstrap();

    return useCallback(
        async (calendarID) => {
            const [{ Keys, Passphrase = {}, Members }, Addresses] = await Promise.all([
                getCalendarBootstrap(calendarID),
                getAddresses()
            ]);

            const getCalendarKeyPassphrase = async (MemberPassphrases = [], addressesMembersMap = {}) => {
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
                        ...splitKeys(addressKeys)
                    }).catch(noop);
                    if (result) {
                        return result;
                    }
                }
            };

            const { ID: PassphraseID, MemberPassphrases } = Passphrase;
            const addressesMembersMap = getAddressesMembersMap(Members, Addresses);
            const passphrase = await getCalendarKeyPassphrase(MemberPassphrases, addressesMembersMap);
            return decryptCalendarKeys(Keys, { [PassphraseID]: passphrase });
        },
        [getAddresses, getAddressKeys, getCalendarBootstrap]
    );
};

export const useGetCalendarKeys = () => {
    const cache = useCache();
    const miss = useGetCalendarKeysRaw();

    return useCallback(
        (key) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            return getPromiseValue(subCache, key, miss);
        },
        [cache, miss]
    );
};
