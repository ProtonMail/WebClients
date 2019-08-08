import { useRef, useEffect, useState } from 'react';
import { useInstance } from 'react-components';
import { decryptCalendarKeys, findPrimaryAddressKey } from 'proton-shared/lib/keys/calendarKeys';

const getResult = (cache, calendars) => {
    return calendars.reduce((acc, { ID }) => {
        const value = cache.get(ID);
        acc[ID] = value ? value.result : undefined;
        return acc;
    }, {});
};

const useCalendarsKeys = (calendars, calendarsBootstrapMap, addresses, addressesKeysMap) => {
    const [state, setState] = useState(() => [false, undefined, undefined]);
    const currentRef = useRef(0);
    const cache = useInstance(() => new Map());

    useEffect(() => {
        if (!calendars || !calendarsBootstrapMap || !Array.isArray(addresses) || !addressesKeysMap) {
            setState([undefined, false, undefined]);
            return;
        }

        setState([state[0], true, state[2]]);

        const current = currentRef.current + 1;
        currentRef.current = current;

        Promise.all(
            calendars.map(({ ID }) => {
                const calendarBootstrap = calendarsBootstrapMap[ID];
                if (!calendarBootstrap) {
                    return;
                }

                const {
                    Members: calendarMembers,
                    Keys: calendarKeys,
                    Passphrases: calendarPassphrases
                } = calendarBootstrap;

                const { member, primaryKey } =
                    findPrimaryAddressKey({
                        calendarMembers,
                        addresses,
                        addressesKeysMap
                    }) || {};

                const fingerprint = primaryKey ? primaryKey.getFingerprint() : undefined;
                const decrypted = primaryKey ? primaryKey.isDecrypted() : undefined;

                const old = cache.get(ID);
                if (
                    old &&
                    old.calendarBootstrap === calendarBootstrap &&
                    old.member === member &&
                    old.fingerprint === fingerprint &&
                    old.decrypted === decrypted
                ) {
                    return;
                }

                return decryptCalendarKeys({
                    calendarKeys,
                    calendarPassphrases,
                    calendarMember: member,
                    primaryKey
                }).then((result) => {
                    if (currentRef.current !== current) {
                        return;
                    }
                    cache.set(ID, { result, calendarBootstrap, member, fingerprint, decrypted });
                });
            })
        )
            .then(() => {
                if (currentRef.current !== current) {
                    return;
                }
                setState([getResult(cache, calendars), false, undefined]);
            })
            .catch((e) => {
                setState([undefined, false, e]);
            });
    }, [calendars, calendarsBootstrapMap, addresses, addressesKeysMap]);

    return state;
};

export default useCalendarsKeys;
