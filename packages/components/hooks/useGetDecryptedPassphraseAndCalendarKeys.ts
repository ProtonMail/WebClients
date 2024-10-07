import { useCallback } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import {
    decryptPassphrase,
    decryptPassphraseSessionKey,
    getDecryptedCalendarKeys,
} from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { getAddressesMembersMap } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import type { Address } from '@proton/shared/lib/interfaces';
import type { MemberPassphrase } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetDecryptedPassphraseAndCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetDecryptedPassphraseAndCalendarKeys';
import { splitKeys } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';

export const CACHE_KEY = 'CALENDAR_KEYS';

const getCalendarKeyPassphrase = async (
    getAddressKeys: GetAddressKeys,
    MemberPassphrases: MemberPassphrase[] = [],
    addressesMembersMap: { [key: string]: Address } = {}
) => {
    // Try to decrypt each passphrase with the address keys belonging to that member until it succeeds.
    for (const { Passphrase, Signature, MemberID } of MemberPassphrases) {
        const Address = addressesMembersMap[MemberID];
        if (!Address) {
            continue;
        }
        const addressKeys = await getAddressKeys(Address.ID);
        const [decryptedPassphrase, decryptedPassphraseSessionKey] = await Promise.all([
            decryptPassphrase({
                armoredPassphrase: Passphrase,
                armoredSignature: Signature,
                ...splitKeys(addressKeys),
            }).catch(noop),
            decryptPassphraseSessionKey({ armoredPassphrase: Passphrase, ...splitKeys(addressKeys) }),
        ]);

        if (!decryptedPassphrase || !decryptedPassphraseSessionKey) {
            throw new Error('Error decrypting calendar passphrase');
        }

        return { decryptedPassphrase, decryptedPassphraseSessionKey };
    }

    return {};
};

const useGetDecryptedPassphraseAndCalendarKeysRaw = () => {
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarBootstrap = useGetCalendarBootstrap();

    return useCallback(
        async (calendarID: string) => {
            const [{ Keys, Passphrase, Members = [] }, Addresses] = await Promise.all([
                getCalendarBootstrap(calendarID),
                getAddresses(),
            ]);

            const { ID: PassphraseID, MemberPassphrases } = Passphrase;
            const addressesMembersMap = getAddressesMembersMap(Members, Addresses);
            const { decryptedPassphrase, decryptedPassphraseSessionKey } = await getCalendarKeyPassphrase(
                getAddressKeys,
                MemberPassphrases,
                addressesMembersMap
            );

            if (!decryptedPassphrase || !decryptedPassphraseSessionKey) {
                throw new Error('No passphrase');
            }

            return {
                decryptedCalendarKeys: await getDecryptedCalendarKeys(Keys, { [PassphraseID]: decryptedPassphrase }),
                decryptedPassphrase,
                decryptedPassphraseSessionKey,
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

export const useGetCalendarKeys = () => {
    const getDecryptedPassphraseAndCalendarKeys = useGetDecryptedPassphraseAndCalendarKeys();

    return useCallback(
        async (calendarID: string) => {
            const { decryptedCalendarKeys } = await getDecryptedPassphraseAndCalendarKeys(calendarID);
            return decryptedCalendarKeys;
        },
        [getDecryptedPassphraseAndCalendarKeys]
    );
};
