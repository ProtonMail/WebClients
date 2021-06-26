import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { useCallback } from 'react';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { splitKeys } from '@proton/shared/lib/keys';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetDecryptedPassphraseAndCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';
import useGetEncryptionPreferences from './useGetEncryptionPreferences';

const useGetCalendarEventRaw = () => {
    const getCalendarKeys = useGetDecryptedPassphraseAndCalendarKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(
        async (Event: CalendarEvent) => {
            const addresses = await getAddresses();

            const [{ decryptedCalendarKeys }, publicKeysMap] = await Promise.all([
                getCalendarKeys(Event.CalendarID),
                getAuthorPublicKeysMap({ event: Event, addresses, getAddressKeys, getEncryptionPreferences }),
            ]);
            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
                calendarEvent: Event,
                ...splitKeys(decryptedCalendarKeys),
            });
            return readCalendarEvent({
                isOrganizer: !!Event.IsOrganizer,
                event: {
                    SharedEvents: withNormalizedAuthors(Event.SharedEvents),
                    CalendarEvents: withNormalizedAuthors(Event.CalendarEvents),
                    AttendeesEvents: withNormalizedAuthors(Event.AttendeesEvents),
                    Attendees: Event.Attendees,
                },
                publicKeysMap,
                sharedSessionKey,
                calendarSessionKey,
                addresses,
            });
        },
        [getAddresses, getAddressKeys, getCalendarKeys]
    );
};

export default useGetCalendarEventRaw;
