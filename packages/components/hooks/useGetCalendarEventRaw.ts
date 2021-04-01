import { OpenPGPKey } from 'pmcrypto';
import { CALENDAR_CARD_TYPE } from 'proton-shared/lib/calendar/constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { canonizeInternalEmail } from 'proton-shared/lib/helpers/email';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { useCallback } from 'react';
import { readCalendarEvent, readSessionKeys } from 'proton-shared/lib/calendar/deserialize';
import { splitKeys } from 'proton-shared/lib/keys';
import { CalendarEvent, CalendarEventData } from 'proton-shared/lib/interfaces/calendar';
import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useGetAddressKeys';
import { useGetCalendarKeys } from './useGetCalendarKeys';
import useGetEncryptionPreferences from './useGetEncryptionPreferences';

const { SIGNED, ENCRYPTED_AND_SIGNED } = CALENDAR_CARD_TYPE;

const useGetCalendarEventRaw = () => {
    const getCalendarKeys = useGetCalendarKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(
        async (Event: CalendarEvent) => {
            const addresses = await getAddresses();
            const getAuthorPublicKeysMap = async () => {
                const publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]> = {};
                const authors = unique(
                    [...Event.SharedEvents, ...Event.CalendarEvents]
                        .map(({ Author, Type }) => {
                            if (![SIGNED, ENCRYPTED_AND_SIGNED].includes(Type)) {
                                // no need to fetch keys in this case
                                return;
                            }
                            return canonizeInternalEmail(Author);
                        })
                        .filter(isTruthy)
                );
                const normalizedAddresses = addresses.map((address) => ({
                    ...address,
                    normalizedEmailAddress: canonizeInternalEmail(address.Email),
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
            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
                calendarEvent: Event,
                ...splitKeys(calendarKeys),
            });
            const withNormalizedAuthor = (x: CalendarEventData) => ({
                ...x,
                Author: canonizeInternalEmail(x.Author),
            });
            const withNormalizedAuthors = (x: CalendarEventData[]) => {
                if (!x) {
                    return [];
                }
                return x.map(withNormalizedAuthor);
            };
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
