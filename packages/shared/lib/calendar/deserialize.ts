import { OpenPGPKey, SessionKey } from 'pmcrypto';

import { deserializeUint8Array } from '../helpers/serialization';
import { decryptAndVerifyPart, decryptCard, getDecryptedSessionKey, verifySignedCard } from './decrypt';
import { parse } from './vcal';
import { unwrap } from './helper';
import { toInternalAttendee } from './attendees';
import {
    CalendarEventData,
    CalendarEventDataMap,
    CalendarEvent,
    CalendarPersonalEventData
} from '../interfaces/calendar';
import { VcalVeventComponent } from '../interfaces/calendar/VcalModel';

export const readSessionKey = (KeyPacket: string, privateKeys: OpenPGPKey | OpenPGPKey[]) => {
    return getDecryptedSessionKey(deserializeUint8Array(KeyPacket), privateKeys);
};

/**
 * Read the session keys.
 */
export const readSessionKeys = (
    { SharedKeyPacket, CalendarKeyPacket }: CalendarEvent,
    privateKeys: OpenPGPKey | OpenPGPKey[]
) => {
    return Promise.all([
        getDecryptedSessionKey(deserializeUint8Array(SharedKeyPacket), privateKeys),
        CalendarKeyPacket ? getDecryptedSessionKey(deserializeUint8Array(CalendarKeyPacket), privateKeys) : undefined
    ]);
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 */
interface ReadCalendarEventArguments {
    event: CalendarEvent;
    publicKeys: OpenPGPKey | OpenPGPKey[];
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
}
export const readCalendarEvent = async ({
    event: { SharedEvents = [], CalendarEvents = [], AttendeesEvent, Attendees = [] },
    publicKeys,
    sharedSessionKey,
    calendarSessionKey
}: ReadCalendarEventArguments) => {
    const sharedPart = SharedEvents.reduce<CalendarEventDataMap>((acc, data) => {
        acc[data.Type] = data;
        return acc;
    }, {});
    const calendarPart = CalendarEvents.reduce<CalendarEventDataMap>((acc, data) => {
        acc[data.Type] = data;
        return acc;
    }, {});
    const attendeesPartEncrypted = AttendeesEvent;

    const [
        [sharedSignedResult, sharedEncryptedResult],
        [calendarSignedResult, calendarEncryptedResult],
        attendeesResult
    ] = await Promise.all([
        decryptAndVerifyPart(sharedPart, publicKeys, sharedSessionKey),
        decryptAndVerifyPart(calendarPart, publicKeys, calendarSessionKey),
        attendeesPartEncrypted &&
            decryptCard(
                deserializeUint8Array(attendeesPartEncrypted.Data),
                attendeesPartEncrypted.Signature,
                publicKeys,
                sharedSessionKey
            )
    ]);

    return {
        ...(sharedEncryptedResult && parse(unwrap(sharedEncryptedResult))),
        ...(sharedSignedResult && parse(unwrap(sharedSignedResult))),
        ...(calendarEncryptedResult && parse(unwrap(calendarEncryptedResult))),
        ...(calendarSignedResult && parse(unwrap(calendarSignedResult))),
        ...(attendeesResult && toInternalAttendee(parse(unwrap(attendeesResult)), Attendees))
    } as VcalVeventComponent;
};

export const readPersonalPart = async (
    { Data, Signature }: CalendarEventData,
    publicKeys: OpenPGPKey | OpenPGPKey[]
) => {
    const result = await verifySignedCard(Data, Signature, publicKeys);
    return parse(unwrap(result)) as VcalVeventComponent;
};

export const getPersonalPartMap = ({ PersonalEvent = [] }: CalendarEvent) => {
    return PersonalEvent.reduce<{ [key: string]: CalendarPersonalEventData }>((acc, result) => {
        const { MemberID } = result;
        acc[MemberID] = result;
        return acc;
    }, {});
};
