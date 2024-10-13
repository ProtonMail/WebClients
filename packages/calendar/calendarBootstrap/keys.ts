import { useCallback } from 'react';

import type { UnknownAction } from '@reduxjs/toolkit';
import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import type { SessionKey } from 'packages/crypto';
import type { ThunkAction } from 'redux-thunk';

import { addressKeysThunk } from '@proton/account/addressKeys';
import { addressesThunk } from '@proton/account/addresses';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    decryptPassphrase,
    decryptPassphraseSessionKey,
    getDecryptedCalendarKeys,
} from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { getAddressesMembersMap } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import type { Address } from '@proton/shared/lib/interfaces';
import type { DecryptedCalendarKey, MemberPassphrase } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetDecryptedPassphraseAndCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetDecryptedPassphraseAndCalendarKeys';
import { splitKeys } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import type { CalendarsBootstrapState } from './index';
import { calendarBootstrapThunk } from './index';

interface DecryptedPassphraseAndCalendarKeysResult {
    decryptedCalendarKeys: DecryptedCalendarKey[];
    decryptedPassphrase: string;
    decryptedPassphraseSessionKey: SessionKey;
    passphraseID: string;
}

const map = new Map<string, Promise<DecryptedPassphraseAndCalendarKeysResult> | undefined>();

export const deleteCalendarFromKeyCache = (calendarID: string) => {
    map.delete(calendarID);
};

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

export const getDecryptedPassphraseAndCalendarKeysThunk = ({
    calendarID,
}: {
    calendarID: string;
}): ThunkAction<
    Promise<DecryptedPassphraseAndCalendarKeysResult>,
    CalendarsBootstrapState,
    ProtonThunkArguments,
    UnknownAction
> => {
    const run = async (dispatch: ThunkDispatch<CalendarsBootstrapState, ProtonThunkArguments, UnknownAction>) => {
        const [{ Keys, Passphrase, Members = [] }, Addresses] = await Promise.all([
            dispatch(calendarBootstrapThunk({ calendarID })),
            dispatch(addressesThunk()),
        ]);

        const { ID: PassphraseID, MemberPassphrases } = Passphrase;
        const addressesMembersMap = getAddressesMembersMap(Members, Addresses);
        const { decryptedPassphrase, decryptedPassphraseSessionKey } = await getCalendarKeyPassphrase(
            (addressID) => dispatch(addressKeysThunk({ addressID })),
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
    };

    return async (dispatch) => {
        const oldPromise = map.get(calendarID);
        if (oldPromise) {
            return oldPromise;
        }
        const promise = run(dispatch);
        map.set(calendarID, promise);
        return promise;
    };
};

export const useGetDecryptedPassphraseAndCalendarKeys = (): GetDecryptedPassphraseAndCalendarKeys => {
    const dispatch = baseUseDispatch<ThunkDispatch<CalendarsBootstrapState, ProtonThunkArguments, Action>>();

    return useCallback((calendarID: string) => {
        return dispatch(getDecryptedPassphraseAndCalendarKeysThunk({ calendarID }));
    }, []);
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
