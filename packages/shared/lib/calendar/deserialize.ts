import { OpenPGPKey, SessionKey } from 'pmcrypto';

import { SimpleMap } from '../interfaces/utils';
import {
    decryptAndVerifyCalendarEvent,
    getDecryptedSessionKey,
    getAggregatedEventVerificationStatus,
    verifySignedCard,
} from './decrypt';
import { parse } from './vcal';
import { unwrap } from './helper';
import { toInternalAttendee } from './attendees';
import { CalendarEventData, CalendarEvent, CalendarPersonalEventData } from '../interfaces/calendar';
import { VcalAttendeeProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { getIsEventComponent } from './vcalHelper';
import { base64StringToUint8Array } from '../helpers/encoding';

export const readSessionKey = (KeyPacket: string, privateKeys: OpenPGPKey | OpenPGPKey[]) => {
    return getDecryptedSessionKey(base64StringToUint8Array(KeyPacket), privateKeys);
};

/**
 * Read the session keys.
 */
export const readSessionKeys = (
    { SharedKeyPacket, CalendarKeyPacket }: CalendarEvent,
    privateKeys: OpenPGPKey | OpenPGPKey[]
) => {
    return Promise.all([
        getDecryptedSessionKey(base64StringToUint8Array(SharedKeyPacket), privateKeys),
        CalendarKeyPacket
            ? getDecryptedSessionKey(base64StringToUint8Array(CalendarKeyPacket), privateKeys)
            : undefined,
    ]);
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 */
interface ReadCalendarEventArguments {
    event: Pick<CalendarEvent, 'SharedEvents' | 'CalendarEvents' | 'AttendeesEvents' | 'Attendees'>;
    publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]>;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
}

export const readCalendarEvent = async ({
    event: { SharedEvents = [], CalendarEvents = [], AttendeesEvents = [], Attendees = [] },
    publicKeysMap,
    sharedSessionKey,
    calendarSessionKey,
}: ReadCalendarEventArguments) => {
    const decryptedEventsResults = await Promise.all([
        Promise.all(SharedEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, sharedSessionKey))),
        Promise.all(CalendarEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, calendarSessionKey))),
        Promise.all(AttendeesEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, sharedSessionKey))),
    ]);
    const [
        decryptedSharedEvents,
        decryptedCalendarEvents,
        decryptedAttendeesEvents,
    ] = decryptedEventsResults.map((decryptedEvents) => decryptedEvents.map(({ data }) => data));
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

    return { veventComponent: veventWithAttendees, verificationStatus };
};

export const readPersonalPart = async (
    { Data, Signature }: CalendarEventData,
    publicKeys: OpenPGPKey | OpenPGPKey[]
) => {
    if (!Signature) {
        throw new Error('Personal part should always be signed');
    }
    const { data, verificationStatus } = await verifySignedCard(Data, Signature, publicKeys);
    return { veventComponent: parse(unwrap(data)) as VcalVeventComponent, verificationStatus };
};

export const getPersonalPartMap = ({ PersonalEvent = [] }: CalendarEvent) => {
    return PersonalEvent.reduce<{ [key: string]: CalendarPersonalEventData }>((acc, result) => {
        const { MemberID } = result;
        acc[MemberID] = result;
        return acc;
    }, {});
};
