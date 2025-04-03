import { type PrivateKeyReference, type PublicKeyReference, type SessionKey } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';

import { getIsAddressActive, getIsAddressExternal } from '../helpers/address';
import { canonicalizeInternalEmail } from '../helpers/email';
import { base64StringToUint8Array } from '../helpers/encoding';
import type { Address, Nullable } from '../interfaces';
import type { VerificationPreferences } from '../interfaces/VerificationPreferences';
import type {
    CalendarEvent,
    CalendarNotificationSettings,
    CalendarSettings,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalVeventComponent,
} from '../interfaces/calendar';
import type { SimpleMap } from '../interfaces/utils';
import { toSessionKey } from '../keys/sessionKey';
import { modelToValarmComponent } from './alarms/modelToValarm';
import { apiNotificationsToModel } from './alarms/notificationsToModel';
import { getAttendeeEmail, toInternalAttendee } from './attendees';
import { ICAL_ATTENDEE_STATUS } from './constants';
import {
    decryptAndVerifyCalendarEvent,
    getAggregatedEventVerificationStatus,
    getDecryptedSessionKey,
} from './crypto/decrypt';
import { unwrap } from './helper';
import { parseWithFoldingRecovery } from './icsSurgery/ics';
import { getAttendeePartstat, getIsEventComponent } from './vcalHelper';

export const readSessionKey = (
    KeyPacket?: Nullable<string>,
    privateKeys?: PrivateKeyReference | PrivateKeyReference[]
) => {
    if (!KeyPacket || !privateKeys) {
        return;
    }
    return getDecryptedSessionKey(base64StringToUint8Array(KeyPacket), privateKeys);
};

/**
 * Read the session keys.
 */
export const readSessionKeys = ({
    calendarEvent,
    decryptedSharedKeyPacket,
    privateKeys,
}: {
    calendarEvent: Pick<CalendarEvent, 'SharedKeyPacket' | 'AddressKeyPacket' | 'CalendarKeyPacket'>;
    decryptedSharedKeyPacket?: string;
    privateKeys?: PrivateKeyReference | PrivateKeyReference[];
}) => {
    const sharedsessionKeyPromise = decryptedSharedKeyPacket
        ? Promise.resolve(toSessionKey(decryptedSharedKeyPacket))
        : readSessionKey(calendarEvent.AddressKeyPacket || calendarEvent.SharedKeyPacket, privateKeys);
    const calendarSessionKeyPromise = readSessionKey(calendarEvent.CalendarKeyPacket, privateKeys);
    return Promise.all([sharedsessionKeyPromise, calendarSessionKeyPromise]);
};

const fromApiNotifications = ({
    notifications: apiNotifications,
    isAllDay,
    calendarSettings,
}: {
    notifications: Nullable<CalendarNotificationSettings[]>;
    isAllDay: boolean;
    calendarSettings: CalendarSettings;
}) => {
    const modelAlarms = apiNotificationsToModel({ notifications: apiNotifications, isAllDay, calendarSettings });

    return modelAlarms.map((alarm) => modelToValarmComponent(alarm));
};

export const getSelfAddressData = ({
    organizer,
    attendees = [],
    addresses = [],
}: {
    organizer?: VcalOrganizerProperty;
    attendees?: VcalAttendeeProperty[];
    addresses?: Address[];
}) => {
    if (!organizer) {
        // it is not an invitation
        return {
            isOrganizer: false,
            isAttendee: false,
        };
    }
    const internalAddresses = addresses.filter((address) => !getIsAddressExternal(address));
    const ownCanonicalizedEmailsMap = internalAddresses.reduce<SimpleMap<string>>((acc, { Email }) => {
        acc[Email] = canonicalizeInternalEmail(Email);
        return acc;
    }, {});

    const organizerEmail = canonicalizeInternalEmail(getAttendeeEmail(organizer));
    const organizerAddress = internalAddresses.find(({ Email }) => ownCanonicalizedEmailsMap[Email] === organizerEmail);

    if (organizerAddress) {
        return {
            isOrganizer: true,
            isAttendee: false,
            selfAddress: organizerAddress,
        };
    }

    const canonicalAttendeeEmails = attendees.map((attendee) => canonicalizeInternalEmail(getAttendeeEmail(attendee)));

    // split active and inactive addresses
    const { activeAddresses, inactiveAddresses } = internalAddresses.reduce<{
        activeAddresses: Address[];
        inactiveAddresses: Address[];
    }>(
        (acc, address) => {
            const addresses = getIsAddressActive(address) ? acc.activeAddresses : acc.inactiveAddresses;
            addresses.push(address);

            return acc;
        },
        { activeAddresses: [], inactiveAddresses: [] }
    );

    // start checking active addresses
    const { selfActiveAttendee, selfActiveAddress, selfActiveAttendeeIndex } = activeAddresses.reduce<{
        selfActiveAttendee?: VcalAttendeeProperty;
        selfActiveAttendeeIndex?: number;
        selfActiveAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const canonicalSelfEmail = ownCanonicalizedEmailsMap[address.Email];
            const index = canonicalAttendeeEmails.findIndex((email) => email === canonicalSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfActiveAttendee && acc.selfActiveAddress)) {
                return {
                    selfActiveAttendee: attendee,
                    selfActiveAddress: address,
                    selfActiveAttendeeIndex: index,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    if (selfActiveAttendee && selfActiveAddress) {
        return {
            isOrganizer: false,
            isAttendee: true,
            selfAttendee: selfActiveAttendee,
            selfAddress: selfActiveAddress,
            selfAttendeeIndex: selfActiveAttendeeIndex,
        };
    }
    // check inactive addresses
    const { selfInactiveAttendee, selfInactiveAddress, selfInactiveAttendeeIndex } = inactiveAddresses.reduce<{
        selfInactiveAttendee?: VcalAttendeeProperty;
        selfInactiveAttendeeIndex?: number;
        selfInactiveAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const canonicalSelfEmail = ownCanonicalizedEmailsMap[address.Email];
            const index = canonicalAttendeeEmails.findIndex((email) => email === canonicalSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfInactiveAttendee && acc.selfInactiveAddress)) {
                return {
                    selfInactiveAttendee: attendee,
                    selfInactiveAttendeeIndex: index,
                    selfInactiveAddress: address,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    return {
        isOrganizer: false,
        isAttendee: !!selfInactiveAttendee,
        selfAttendee: selfInactiveAttendee,
        selfAddress: selfInactiveAddress,
        selfAttendeeIndex: selfInactiveAttendeeIndex,
    };
};

const readCalendarAlarms = (
    { Notifications, FullDay }: Pick<CalendarEvent, 'Notifications' | 'FullDay'>,
    calendarSettings: CalendarSettings
) => {
    return {
        valarmComponents: fromApiNotifications({
            notifications: Notifications || null,
            isAllDay: !!FullDay,
            calendarSettings,
        }),
        hasDefaultNotifications: !Notifications,
    };
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 */
interface ReadCalendarEventArguments {
    event: Pick<
        CalendarEvent,
        | 'SharedEvents'
        | 'CalendarEvents'
        | 'AttendeesEvents'
        | 'AttendeesInfo'
        | 'Notifications'
        | 'FullDay'
        | 'CalendarID'
        | 'ID'
        | 'UID'
        | 'Color'
    >;
    publicKeysMap?: SimpleMap<PublicKeyReference | PublicKeyReference[]>;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    calendarSettings: CalendarSettings;
    addresses: Address[];
    encryptingAddressID?: string;
    getAttendeeVerificationPreferences: (attendeeEmail: string) => Promise<VerificationPreferences>;
}

export const readCalendarEvent = async ({
    event: {
        SharedEvents = [],
        CalendarEvents = [],
        AttendeesEvents = [],
        AttendeesInfo,
        Notifications,
        FullDay,
        CalendarID: calendarID,
        ID: eventID,
        Color,
        UID: eventUID,
    },
    publicKeysMap = {},
    addresses,
    sharedSessionKey,
    calendarSessionKey,
    calendarSettings,
    encryptingAddressID,
    getAttendeeVerificationPreferences,
}: ReadCalendarEventArguments) => {
    const decryptedEventsResults = await Promise.all([
        Promise.all(SharedEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, sharedSessionKey))),
        Promise.all(CalendarEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, calendarSessionKey))),
        Promise.all(AttendeesEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, sharedSessionKey))),
    ]);
    const [decryptedSharedEvents, decryptedCalendarEvents, decryptedAttendeesEvents] = decryptedEventsResults.map(
        (decryptedEvents) => decryptedEvents.map(({ data }) => data)
    );
    const verificationStatusArray = decryptedEventsResults
        .map((decryptedEvents) => decryptedEvents.map(({ verificationStatus }) => verificationStatus))
        .flat();
    const verificationStatus = getAggregatedEventVerificationStatus(verificationStatusArray);

    const vevent = [...decryptedSharedEvents, ...decryptedCalendarEvents].reduce<VcalVeventComponent>((acc, event) => {
        if (!event) {
            return acc;
        }
        const parsedComponent = parseWithFoldingRecovery(unwrap(event), { calendarID, eventID });
        if (!getIsEventComponent(parsedComponent)) {
            return acc;
        }
        return { ...acc, ...parsedComponent };
    }, {} as VcalVeventComponent);

    const { valarmComponents, hasDefaultNotifications } = readCalendarAlarms(
        { Notifications, FullDay },
        calendarSettings
    );

    const veventAttendeesPromises = decryptedAttendeesEvents
        .map((event) => {
            if (!event) {
                return false;
            }

            const parsedComponent = parseWithFoldingRecovery(unwrap(event), { calendarID, eventID });

            if (!getIsEventComponent(parsedComponent)) {
                return false;
            }

            return toInternalAttendee(
                parsedComponent,
                AttendeesInfo?.Attendees || [],
                sharedSessionKey,
                eventUID,
                getAttendeeVerificationPreferences
            );
        })
        .filter(isTruthy)
        .flat();

    const veventAttendees = await Promise.all(veventAttendeesPromises);

    if (valarmComponents.length) {
        vevent.components = valarmComponents;
    }

    if (veventAttendees.length) {
        vevent.attendee = veventAttendees;
    }

    if (Color) {
        vevent.color = { value: Color };
    }

    const selfAddressData = getSelfAddressData({
        organizer: vevent.organizer,
        attendees: veventAttendees,
        addresses,
    });
    const encryptionData = {
        encryptingAddressID,
        sharedSessionKey,
        calendarSessionKey,
    };

    return { veventComponent: vevent, hasDefaultNotifications, verificationStatus, selfAddressData, encryptionData };
};
