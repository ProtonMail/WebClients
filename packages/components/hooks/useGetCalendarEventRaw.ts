import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/keys/getCalendarEventDecryptionKeys';
import { useCallback } from 'react';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';
import useGetEncryptionPreferences from './useGetEncryptionPreferences';

const useGetCalendarEventRaw = () => {
    const getCalendarKeys = useGetCalendarKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(
        async (Event: CalendarEvent) => {
            const { IsOrganizer, AddressKeyPacket, AddressID, SharedEvents, CalendarEvents, AttendeesEvents } = Event;
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
                isOrganizer: !!IsOrganizer,
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
