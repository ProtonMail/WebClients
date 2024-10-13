import { useCallback } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

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
                ID,
                SharedEvents,
                CalendarEvents,
                AttendeesEvents,
                Attendees,
                Notifications,
                Color,
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
                    Notifications,
                    FullDay,
                    CalendarID,
                    ID,
                    Color,
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
