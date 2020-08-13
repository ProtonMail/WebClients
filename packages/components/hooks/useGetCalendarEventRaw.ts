import { OpenPGPKey } from 'pmcrypto';
import { unique } from 'proton-shared/lib/helpers/array';
import { normalizeEmail } from 'proton-shared/lib/helpers/email';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { useCallback } from 'react';
import { readCalendarEvent, readSessionKeys } from 'proton-shared/lib/calendar/deserialize';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { CalendarEvent, CalendarEventData } from 'proton-shared/lib/interfaces/calendar';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarBootstrap } from './useGetCalendarBootstrap';
import { useGetPublicKeys } from './useGetPublicKeys';
import { useGetCalendarKeys } from './useGetCalendarKeys';
import useGetEncryptionPreferences from './useGetEncryptionPreferences';

const useGetCalendarEventRaw = () => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getCalendarKeys = useGetCalendarKeys();
    const getPublicKeys = useGetPublicKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(
        async (Event: CalendarEvent) => {
            const getAuthorPublicKeysMap = async () => {
                const publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]> = {};
                const authors = unique(
                    [...Event.SharedEvents, ...Event.CalendarEvents, ...Event.PersonalEvent].map(({ Author }) =>
                        normalizeEmail(Author)
                    )
                );
                const addresses = await getAddresses();
                const normalizedAddresses = addresses.map((address) => ({
                    ...address,
                    normalizedEmailAddress: normalizeEmail(address.Email),
                }));
                const promises = authors.map(async (author) => {
                    const ownAddress = normalizedAddresses.find(
                        ({ normalizedEmailAddress }) => normalizedEmailAddress === author
                    );
                    if (ownAddress) {
                        const result = await getAddressKeys(ownAddress.ID);
                        publicKeysMap[author] = splitKeys(result).publicKeys;
                    } else {
                        const { pinnedKeys } = await getEncryptionPreferences(author);
                        publicKeysMap[author] = pinnedKeys;
                    }
                });
                await Promise.all(promises);

                return publicKeysMap;
            };

            const [calendarKeys, publicKeysMap] = await Promise.all([
                getCalendarKeys(Event.CalendarID),
                getAuthorPublicKeysMap(),
            ]);
            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys(
                Event,
                splitKeys(calendarKeys).privateKeys
            );
            const withNormalizedAuthor = (x: CalendarEventData) => ({
                ...x,
                Author: normalizeEmail(x.Author),
            });
            const withNormalizedAuthors = (x: CalendarEventData[]) => {
                if (!x) {
                    return [];
                }
                return x.map(withNormalizedAuthor);
            };
            return readCalendarEvent({
                event: {
                    SharedEvents: withNormalizedAuthors(Event.SharedEvents),
                    CalendarEvents: withNormalizedAuthors(Event.CalendarEvents),
                    AttendeesEvents: withNormalizedAuthors(Event.AttendeesEvents),
                    Attendees: Event.Attendees,
                },
                publicKeysMap,
                sharedSessionKey,
                calendarSessionKey,
            });
        },
        [getAddresses, getAddressKeys, getCalendarBootstrap, getCalendarKeys, getPublicKeys]
    );
};

export default useGetCalendarEventRaw;
