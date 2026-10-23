import { useCallback } from 'react';

import { VERIFICATION_STATUS } from '@protontech/crypto';
import type { Action, ThunkAction, ThunkDispatch } from '@reduxjs/toolkit';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { getVerificationPreferencesThunk } from '@proton/account/publicKeys/verificationPreferences';
import { baseUseDispatch } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '@proton/shared/lib/calendar/author';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { readCalendarEvent, readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar/Event';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import type { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { tracker } from '@proton/telemetry-tracker/tracker';

import { useGetCalendarBootstrap } from '../calendarBootstrap/hooks';
import { useGetCalendarKeys } from '../calendarBootstrap/keys';
import { legacySignatureFallback } from '../telemetry/events';

type VerificationPreferencesThunk = ReturnType<typeof getVerificationPreferencesThunk>;
type VerificationPreferencesState =
    VerificationPreferencesThunk extends ThunkAction<unknown, infer State, ProtonThunkArguments, Action>
        ? State
        : never;

// One report per event is enough, the same event is read many times (grid, popovers, notifications)
const eventIDsReportedForLegacyVerification = new Set<string>();

export const useGetCalendarEventRaw = (contactEmailsMap: SimpleMap<ContactEmail>): GetCalendarEventRaw => {
    const getCalendarKeys = useGetCalendarKeys();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const dispatch = baseUseDispatch<ThunkDispatch<VerificationPreferencesState, ProtonThunkArguments, Action>>();
    const getVerificationPreferences = useCallback<GetVerificationPreferences>(
        (args) => dispatch(getVerificationPreferencesThunk(args)),
        [dispatch]
    );

    return useCallback(
        async (Event: CalendarEvent) => {
            const {
                CalendarID,
                ID,
                UID,
                SharedEvents,
                CalendarEvents,
                AttendeesEvents,
                AttendeesInfo,
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
                    getVerificationPreferences,
                    contactEmailsMap,
                }),
                getCalendarBootstrap(CalendarID),
            ]);
            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
                calendarEvent: Event,
                privateKeys,
            });

            const getAttendeeVerificationPreferences = async (attendeeEmail: string) => {
                const result = await getVerificationPreferences({
                    email: attendeeEmail,
                    contactEmailsMap,
                });
                return result;
            };

            const onLegacyVerification = (legacyVerificationStatus: VERIFICATION_STATUS) => {
                if (eventIDsReportedForLegacyVerification.has(ID)) {
                    return;
                }
                eventIDsReportedForLegacyVerification.add(ID);
                tracker.emit(legacySignatureFallback, {
                    dimensions: {
                        legacy_verification:
                            legacyVerificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID ? 'valid' : 'invalid',
                    },
                });
            };

            return readCalendarEvent({
                event: {
                    SharedEvents: withNormalizedAuthors(SharedEvents),
                    CalendarEvents: withNormalizedAuthors(CalendarEvents),
                    AttendeesEvents: withNormalizedAuthors(AttendeesEvents),
                    AttendeesInfo,
                    Notifications,
                    FullDay,
                    CalendarID,
                    ID,
                    UID,
                    Color,
                },
                publicKeysMap,
                sharedSessionKey,
                calendarSessionKey,
                calendarSettings,
                addresses,
                encryptingAddressID,
                getAttendeeVerificationPreferences,
                onLegacyVerification,
            });
        },
        [getAddresses, getAddressKeys, getCalendarKeys, contactEmailsMap]
    );
};
