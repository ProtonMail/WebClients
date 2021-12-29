import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { AES256 } from '../constants';
import { getIsAddressDisabled } from '../helpers/address';
import { canonizeInternalEmail } from '../helpers/email';
import { base64StringToUint8Array } from '../helpers/encoding';
import { unary } from '../helpers/function';
import { Address } from '../interfaces';
import {
    CalendarEvent,
    CalendarEventData,
    CalendarPersonalEventData,
    VcalVeventComponent,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
} from '../interfaces/calendar';

import { SimpleMap } from '../interfaces/utils';
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

export const readSessionKey = (KeyPacket?: string, privateKeys?: OpenPGPKey | OpenPGPKey[]) => {
    if (!KeyPacket || !privateKeys) {
        return;
    }
    return getDecryptedSessionKey(base64StringToUint8Array(KeyPacket), privateKeys);
};

/**
 * Read the session keys.
 */
export const readSessionKeys = async ({
    decryptedSharedKeyPacket,
    calendarEvent,
    privateKeys,
}: {
    decryptedSharedKeyPacket?: string;
    calendarEvent?: CalendarEvent;
    privateKeys?: OpenPGPKey | OpenPGPKey[];
}) => {
    const sharedsessionKeyPromise = decryptedSharedKeyPacket
        ? Promise.resolve({ algorithm: AES256, data: base64StringToUint8Array(decryptedSharedKeyPacket) })
        : readSessionKey(calendarEvent?.SharedKeyPacket, privateKeys);
    const calendarSessionKeyPromise = readSessionKey(calendarEvent?.CalendarKeyPacket, privateKeys);
    return Promise.all([sharedsessionKeyPromise, calendarSessionKeyPromise]);
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 */
interface ReadCalendarEventArguments {
    isOrganizer: boolean;
    event: Pick<CalendarEvent, 'SharedEvents' | 'CalendarEvents' | 'AttendeesEvents' | 'Attendees'>;
    publicKeysMap?: SimpleMap<OpenPGPKey | OpenPGPKey[]>;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    addresses: Address[];
}

export const getSelfAddressData = ({
    isOrganizer,
    organizer,
    attendees = [],
    addresses = [],
}: {
    isOrganizer: boolean;
    organizer?: VcalOrganizerProperty;
    attendees?: VcalAttendeeProperty[];
    addresses?: Address[];
}) => {
    if (isOrganizer) {
        if (!organizer) {
            // old events will not have organizer
            return {};
        }
        const organizerEmail = canonizeInternalEmail(getAttendeeEmail(organizer));
        return {
            selfAddress: addresses.find(({ Email }) => canonizeInternalEmail(Email) === organizerEmail),
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
            const canonicalSelfEmail = canonizeInternalEmail(address.Email);
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
            const canonicalSelfEmail = canonizeInternalEmail(address.Email);
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
        selfAttendee: selfDisabledAttendee,
        selfAddress: selfDisabledAddress,
        selfAttendeeIndex: selfDisabledAttendeeIndex,
    };
};

export const readCalendarEvent = async ({
    isOrganizer,
    event: { SharedEvents = [], CalendarEvents = [], AttendeesEvents = [], Attendees = [] },
    publicKeysMap = {},
    sharedSessionKey,
    calendarSessionKey,
    addresses,
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
        isOrganizer,
        organizer: vevent.organizer,
        attendees: veventAttendees,
        addresses,
    });
    return { veventComponent: veventWithAttendees, verificationStatus, selfAddressData };
};

export const readPersonalPart = async (
    { Data, Signature }: CalendarEventData,
    publicKeys: OpenPGPKey | OpenPGPKey[]
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
