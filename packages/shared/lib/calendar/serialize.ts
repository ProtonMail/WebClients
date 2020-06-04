import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { serializeUint8Array } from '../helpers/serialization';

import { getVeventParts } from './veventHelper';
import { createSessionKey, encryptPart, getEncryptedSessionKey, signPart } from './encrypt';
import { CALENDAR_CARD_TYPE } from './constants';
import { VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { AttendeeClearPartResult, EncryptPartResult, SignPartResult } from './interface';
import isTruthy from '../helpers/isTruthy';
import { getIsEventComponent } from './vcalHelper';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR } = CALENDAR_CARD_TYPE;

/**
 * Format the data into what the API expects.
 */
interface FormatDataArguments {
    sharedSignedPart: SignPartResult;
    sharedEncryptedPart: EncryptPartResult;
    sharedSessionKey?: Uint8Array;
    calendarSignedPart?: SignPartResult;
    calendarEncryptedPart?: EncryptPartResult;
    calendarSessionKey?: Uint8Array;
    personalSignedPart?: SignPartResult;
    attendeesEncryptedPart?: EncryptPartResult;
    attendeesClearPart?: AttendeeClearPartResult[];
}
export const formatData = ({
    sharedSignedPart,
    sharedEncryptedPart,
    sharedSessionKey,
    calendarSignedPart,
    calendarEncryptedPart,
    calendarSessionKey,
    personalSignedPart,
    attendeesEncryptedPart,
    attendeesClearPart
}: FormatDataArguments) => {
    return {
        SharedKeyPacket: sharedSessionKey ? serializeUint8Array(sharedSessionKey) : undefined,
        SharedEventContent: [
            // Shared part should always exists
            {
                Type: SIGNED,
                Data: sharedSignedPart.data,
                Signature: sharedSignedPart.signature.armor()
            },
            {
                Type: ENCRYPTED_AND_SIGNED,
                Data: serializeUint8Array(sharedEncryptedPart.dataPacket),
                Signature: sharedEncryptedPart.signature.armor()
            }
        ],
        CalendarKeyPacket:
            calendarEncryptedPart && calendarSessionKey ? serializeUint8Array(calendarSessionKey) : undefined,
        CalendarEventContent:
            calendarSignedPart || calendarEncryptedPart
                ? [
                      // Calendar parts are optional
                      calendarSignedPart && {
                          Type: SIGNED,
                          Data: calendarSignedPart.data,
                          Signature: calendarSignedPart.signature.armor()
                      },
                      calendarEncryptedPart && {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: serializeUint8Array(calendarEncryptedPart.dataPacket),
                          Signature: calendarEncryptedPart.signature.armor()
                      }
                  ].filter(isTruthy)
                : undefined,
        // Personal part is optional
        PersonalEventContent: personalSignedPart
            ? {
                  Type: SIGNED,
                  Data: personalSignedPart.data,
                  Signature: personalSignedPart.signature.armor()
              }
            : undefined,
        AttendeesEventContent: attendeesEncryptedPart
            ? {
                  Type: ENCRYPTED_AND_SIGNED,
                  Data: serializeUint8Array(attendeesEncryptedPart.dataPacket),
                  Signature: attendeesEncryptedPart.signature.armor()
              }
            : undefined,
        Attendees: attendeesClearPart
            ? attendeesClearPart.map(({ token, permissions }) => ({ Token: token, Permissions: permissions }))
            : undefined
    };
};

/**
 * Split the properties of the component into parts.
 */
const getParts = (eventComponent: VcalVeventComponent) => {
    if (!getIsEventComponent(eventComponent)) {
        throw new Error('Type other than vevent not supported');
    }
    return getVeventParts(eventComponent);
};

/**
 * Create a calendar event by encrypting and serializing an internal vcal component.
 */
interface CreateCalendarEventArguments {
    eventComponent: VcalVeventComponent;
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey;
    signingKey: OpenPGPKey;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    isSwitchCalendar: boolean;
}
export const createCalendarEvent = async ({
    eventComponent,
    privateKey,
    publicKey,
    signingKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey,
    isSwitchCalendar = false
}: CreateCalendarEventArguments) => {
    const { sharedPart, calendarPart, personalPart, attendeesPart } = getParts(eventComponent);

    // If there is no encrypted calendar part, a calendar session key does not need to be created.
    const shouldCreateCalendarKey = !!calendarPart[ENCRYPTED_AND_SIGNED];

    const [calendarSessionKey, sharedSessionKey] = await Promise.all([
        shouldCreateCalendarKey ? oldCalendarSessionKey || createSessionKey(publicKey) : undefined,
        oldSharedSessionKey || createSessionKey(publicKey)
    ]);

    const [
        encryptedCalendarSessionKey,
        encryptedSharedSessionKey,
        sharedSignedPart,
        sharedEncryptedPart,
        calendarSignedPart,
        calendarEncryptedPart,
        personalSignedPart,
        attendeesEncryptedPart
    ] = await Promise.all([
        // If there was no old calendar session key, and we created one, encrypt it to be sent to the API.
        !oldCalendarSessionKey && calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, privateKey)
            : undefined,
        // If we're updating an event (but not switching calendar), no need to encrypt again the session key.
        oldSharedSessionKey && !isSwitchCalendar ? undefined : getEncryptedSessionKey(sharedSessionKey, privateKey),
        signPart(sharedPart[SIGNED], signingKey),
        encryptPart(sharedPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey),
        signPart(calendarPart[SIGNED], signingKey),
        calendarSessionKey && encryptPart(calendarPart[ENCRYPTED_AND_SIGNED], signingKey, calendarSessionKey),
        signPart(personalPart[SIGNED], signingKey),
        encryptPart(attendeesPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey)
    ]);

    return formatData({
        sharedSignedPart,
        sharedEncryptedPart,
        sharedSessionKey: encryptedSharedSessionKey,
        calendarSignedPart,
        calendarEncryptedPart,
        calendarSessionKey: encryptedCalendarSessionKey,
        personalSignedPart,
        attendeesEncryptedPart,
        attendeesClearPart: attendeesPart[CLEAR]
    });
};
