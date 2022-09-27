import { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import unary from '@proton/utils/unary';

import { getIsAddressDisabled } from '../helpers/address';
import { canonizeInternalEmail } from '../helpers/email';
import { base64StringToUint8Array } from '../helpers/encoding';
import { Address, Nullable } from '../interfaces';
import {
    CalendarEvent,
    CalendarEventData,
    CalendarPersonalEventData,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalVeventComponent,
} from '../interfaces/calendar';
import { SimpleMap } from '../interfaces/utils';
import { toSessionKey } from '../keys/sessionKey';
import { getAttendeeEmail, toInternalAttendee } from './attendees';
import { ICAL_ATTENDEE_STATUS } from './constants';
import {
    decryptAndVerifyCalendarEvent,
    getAggregatedEventVerificationStatus,
    getDecryptedSessionKey,
    verifySignedCard,
} from './decrypt';
import { unwrap } from './helper';
import { parse } from './vcal';
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
export const readSessionKeys = async ({
    calendarEvent,
    decryptedSharedKeyPacket,
    privateKeys,
}: {
    calendarEvent: CalendarEvent;
    decryptedSharedKeyPacket?: string;
    privateKeys?: PrivateKeyReference | PrivateKeyReference[];
}) => {
    const sharedsessionKeyPromise = decryptedSharedKeyPacket
        ? Promise.resolve(toSessionKey(decryptedSharedKeyPacket))
        : readSessionKey(calendarEvent.AddressKeyPacket || calendarEvent.SharedKeyPacket, privateKeys);
    const calendarSessionKeyPromise = readSessionKey(calendarEvent.CalendarKeyPacket, privateKeys);
    return Promise.all([sharedsessionKeyPromise, calendarSessionKeyPromise]);
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 */
interface ReadCalendarEventArguments {
    event: Pick<CalendarEvent, 'SharedEvents' | 'CalendarEvents' | 'AttendeesEvents' | 'Attendees'>;
    publicKeysMap?: SimpleMap<PublicKeyReference | PublicKeyReference[]>;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    addresses: Address[];
    encryptingAddressID?: string;
}

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
    const ownCanonizedEmailsMap = addresses.reduce<SimpleMap<string>>((acc, { Email }) => {
        acc[Email] = canonizeInternalEmail(Email);
        return acc;
    }, {});

    const organizerEmail = canonizeInternalEmail(getAttendeeEmail(organizer));
    const organizerAddress = addresses.find(({ Email }) => ownCanonizedEmailsMap[Email] === organizerEmail);

    if (organizerAddress) {
        return {
            isOrganizer: true,
            isAttendee: false,
            selfAddress: organizerAddress,
        };
    }

    const canonicalAttendeeEmails = attendees.map((attendee) => canonizeInternalEmail(getAttendeeEmail(attendee)));

    // start checking active addresses
    const activeAddresses = addresses.filter(({ Status }) => Status !== 0);
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
            const canonicalSelfEmail = ownCanonizedEmailsMap[address.Email];
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
    const disabledAddresses = addresses.filter(unary(getIsAddressDisabled));
    const { selfDisabledAttendee, selfDisabledAddress, selfDisabledAttendeeIndex } = disabledAddresses.reduce<{
        selfDisabledAttendee?: VcalAttendeeProperty;
        selfDisabledAttendeeIndex?: number;
        selfDisabledAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const canonicalSelfEmail = ownCanonizedEmailsMap[address.Email];
            const index = canonicalAttendeeEmails.findIndex((email) => email === canonicalSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfDisabledAttendee && acc.selfDisabledAddress)) {
                return {
                    selfDisabledAttendee: attendee,
                    selfDisabledAttendeeIndex: index,
                    selfDisabledAddress: address,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    return {
        isOrganizer: false,
        isAttendee: !!selfDisabledAttendee,
        selfAttendee: selfDisabledAttendee,
        selfAddress: selfDisabledAddress,
        selfAttendeeIndex: selfDisabledAttendeeIndex,
    };
};

export const readCalendarEvent = async ({
    event: { SharedEvents = [], CalendarEvents = [], AttendeesEvents = [], Attendees = [] },
    publicKeysMap = {},
    sharedSessionKey,
    calendarSessionKey,
    addresses,
    encryptingAddressID,
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
        const parsedComponent = parse(unwrap(event));
        if (!getIsEventComponent(parsedComponent)) {
            return acc;
        }
        return { ...acc, ...parsedComponent };
    }, {} as VcalVeventComponent);

    const veventAttendees = decryptedAttendeesEvents.reduce<VcalAttendeeProperty[]>((acc, event) => {
        if (!event) {
            return acc;
        }
        const parsedComponent = parse(unwrap(event));
        if (!getIsEventComponent(parsedComponent)) {
            return acc;
        }
        return acc.concat(toInternalAttendee(parsedComponent, Attendees));
    }, []);

    const veventWithAttendees = veventAttendees.length ? { ...vevent, attendee: veventAttendees } : vevent;
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
    return { veventComponent: veventWithAttendees, verificationStatus, selfAddressData, encryptionData };
};

export const readPersonalPart = async (
    { Data, Signature }: CalendarEventData,
    publicKeys: PublicKeyReference | PublicKeyReference[]
) => {
    const { data, verificationStatus } = await verifySignedCard(Data, Signature, publicKeys);
    return { veventComponent: parse(unwrap(data)) as VcalVeventComponent, verificationStatus };
};

export const getPersonalPartMap = ({ PersonalEvents = [] }: CalendarEvent) => {
    return PersonalEvents.reduce<{ [key: string]: CalendarPersonalEventData }>((acc, result) => {
        const { MemberID } = result;
        acc[MemberID] = result;
        return acc;
    }, {});
};
