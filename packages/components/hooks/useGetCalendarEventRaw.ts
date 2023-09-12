import { useCallback } from 'react';

import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { useGetCalendarKeys } from './useGetDecryptedPassphraseAndCalendarKeys';
import useGetVerificationPreferences from './useGetVerificationPreferences';

const useGetCalendarEventRaw = (contactEmailsMap: SimpleMap<ContactEmail>): GetCalendarEventRaw => {
    const getCalendarKeys = useGetCalendarKeys();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getVerificationPreferences = useGetVerificationPreferences();

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
                FullDay,
            } = Event;
            const encryptingAddressID = getIsAutoAddedInvite(Event) ? Event.AddressID : undefined;
            const addresses = await getAddresses();

            const [privateKeys, publicKeysMap, { CalendarSettings: calendarSettings }] = await Promise.all([
                getCalendarEventDecryptionKeys({ calendarEvent: Event, getAddressKeys, getCalendarKeys }),
                getAuthorPublicKeysMap({
                    event: Event,
                    addresses,
                    getAddressKeys,
                    getVerificationPreferences,
                    contactEmailsMap,
                }),
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
        [getAddresses, getAddressKeys, getCalendarKeys, contactEmailsMap]
    );
};

export default useGetCalendarEventRaw;
