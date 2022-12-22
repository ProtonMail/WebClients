import { useCallback } from 'react';

import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/keys/getCalendarEventDecryptionKeys';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { useGetCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';
import useGetEncryptionPreferences from './useGetEncryptionPreferences';

const useGetCalendarEventRaw = (): GetCalendarEventRaw => {
    const getCalendarKeys = useGetCalendarKeys();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(
        async (Event: CalendarEvent) => {
            const {
                CalendarID,
                SharedEvents,
                CalendarEvents,
                AttendeesEvents,
                Attendees,
                PersonalEvents,
                Notifications,
                IsPersonalMigrated,
                FullDay,
            } = Event;
            const encryptingAddressID = getIsAutoAddedInvite(Event) ? Event.AddressID : undefined;
            const addresses = await getAddresses();

            const [privateKeys, publicKeysMap, { CalendarSettings: calendarSettings }] = await Promise.all([
                getCalendarEventDecryptionKeys({ calendarEvent: Event, getAddressKeys, getCalendarKeys }),
                getAuthorPublicKeysMap({ event: Event, addresses, getAddressKeys, getEncryptionPreferences }),
                getCalendarBootstrap(CalendarID),
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
                    Attendees,
                    PersonalEvents,
                    Notifications,
                    IsPersonalMigrated,
                    FullDay,
                },
                publicKeysMap,
                sharedSessionKey,
                calendarSessionKey,
                calendarSettings,
                addresses,
                encryptingAddressID,
            });
        },
        [getAddresses, getAddressKeys, getCalendarKeys]
    );
};

export default useGetCalendarEventRaw;
