import { useCallback } from 'react';

import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/keys/getCalendarEventDecryptionKeys';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';
import useGetEncryptionPreferences from './useGetEncryptionPreferences';

const useGetCalendarEventRaw = (): GetCalendarEventRaw => {
    const getCalendarKeys = useGetCalendarKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(
        async (Event: CalendarEvent) => {
            const { AddressKeyPacket, AddressID, SharedEvents, CalendarEvents, AttendeesEvents } = Event;
            const encryptingAddressID = AddressKeyPacket && AddressID ? AddressID : undefined;
            const addresses = await getAddresses();

            const [privateKeys, publicKeysMap] = await Promise.all([
                getCalendarEventDecryptionKeys({ calendarEvent: Event, getAddressKeys, getCalendarKeys }),
                getAuthorPublicKeysMap({ event: Event, addresses, getAddressKeys, getEncryptionPreferences }),
            ]);
            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
                calendarEvent: Event,
                privateKeys,
            });
            return readCalendarEvent({
                event: {
                    SharedEvents: withNormalizedAuthors(SharedEvents),
                    CalendarEvents: withNormalizedAuthors(CalendarEvents),
                    AttendeesEvents: withNormalizedAuthors(AttendeesEvents),
                    Attendees: Event.Attendees,
                },
                publicKeysMap,
                sharedSessionKey,
                calendarSessionKey,
                addresses,
                encryptingAddressID,
            });
        },
        [getAddresses, getAddressKeys, getCalendarKeys]
    );
};

export default useGetCalendarEventRaw;
