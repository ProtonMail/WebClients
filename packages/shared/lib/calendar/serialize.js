import { serializeUint8Array } from '../helpers/serialization';

import { getVeventParts } from './veventHelper';
import { createSessionKey, encryptAndSignPart, encryptCard, getEncryptedSessionKey, signCard } from './encrypt';
import { CALENDAR_CARD_TYPE } from './constants';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR } = CALENDAR_CARD_TYPE;

/**
 * Format the data into what the API expects.
 * @param {Object} sharedSigned
 * @param {Object} sharedEncrypted
 * @param {Uint8Array} [sharedSessionKey]
 * @param {Object} [calendarSigned]
 * @param {Object} [calendarEncrypted]
 * @param {Uint8Array} [calendarSessionKey]
 * @param {Object} [personalSigned]
 * @param {Object} [attendeesEncrypted]
 * @param {Array} [attendees]
 * @returns {Object}
 */
export const formatData = ({
    shared: [sharedSigned, sharedEncrypted],
    sharedSessionKey,
    calendar: [calendarSigned, calendarEncrypted],
    calendarSessionKey,
    personalSigned,
    attendeesEncrypted,
    attendees
}) => {
    return {
        SharedKeyPacket: sharedSessionKey ? serializeUint8Array(sharedSessionKey) : undefined,
        SharedEventContent: [
            // Shared part should always exists
            {
                Type: SIGNED,
                Data: sharedSigned.data,
                Signature: sharedSigned.signature.armor()
            },
            {
                Type: ENCRYPTED_AND_SIGNED,
                Data: serializeUint8Array(sharedEncrypted.dataPacket),
                Signature: sharedEncrypted.signature.armor()
            }
        ],
        CalendarKeyPacket:
            calendarEncrypted && calendarSessionKey ? serializeUint8Array(calendarSessionKey) : undefined,
        CalendarEventContent:
            calendarSigned || calendarEncrypted
                ? [
                      // Calendar parts are optional
                      calendarSigned && {
                          Type: SIGNED,
                          Data: calendarSigned.data,
                          Signature: calendarSigned.signature.armor()
                      },
                      calendarEncrypted && {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: serializeUint8Array(calendarEncrypted.dataPacket),
                          Signature: calendarEncrypted.signature.armor()
                      }
                  ].filter(Boolean)
                : undefined,
        // Personal part is optional
        PersonalEventContent: personalSigned
            ? {
                  Type: SIGNED,
                  Data: personalSigned.data,
                  Signature: personalSigned.signature.armor()
              }
            : undefined,
        AttendeesEventContent: attendeesEncrypted
            ? {
                  Type: ENCRYPTED_AND_SIGNED,
                  Data: serializeUint8Array(attendeesEncrypted.dataPacket),
                  Signature: attendeesEncrypted.signature.armor()
              }
            : undefined,
        Attendees: attendees
            ? attendees.map(({ token, permissions }) => ({ Token: token, Permissions: permissions }))
            : undefined
    };
};

/**
 * Split the properties of the component into parts.
 * @param {Object} eventComponent
 * @returns {Object}
 */
const getParts = (eventComponent) => {
    if (eventComponent.component !== 'vevent') {
        throw new Error('Type other than vevent not supported');
    }
    return getVeventParts(eventComponent);
};

/**
 * Create a calendar event by encrypting and serializing an internal vcal component.
 * @param {Object} eventComponent
 * @param {PGPKey} privateKey - The primary calendar key
 * @param {PGPKey} publicKey - The primary calendar public key
 * @param {PGPKey} signingKey - The primary address key of the member creating the event
 * @param {PGPKey} [sharedSessionKey] - If this event is being updated. The shared session key
 * @param {PGPKey} [calendarSessionKey] - If this event is being updated. Can be undefined if no calendar encrypted part has been created
 * @return {Promise}
 */
export const createCalendarEvent = async ({
    eventComponent,
    privateKey,
    publicKey,
    signingKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey
}) => {
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
        sharedEncryptedPart,
        calendarEncryptedPart,
        personalSigned,
        attendeesEncryptedPart
    ] = await Promise.all([
        // If there was no old calendar session key, and we created one, encrypt it to be sent to the API.
        !oldCalendarSessionKey && calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, privateKey)
            : undefined,
        // If there was no old shared session key, it's the first time the event is being created, so encrypt it.
        !oldSharedSessionKey ? getEncryptedSessionKey(sharedSessionKey, privateKey) : undefined,
        encryptAndSignPart(sharedPart, signingKey, sharedSessionKey),
        encryptAndSignPart(calendarPart, signingKey, calendarSessionKey),
        signCard(personalPart[SIGNED], signingKey),
        encryptCard(attendeesPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey)
    ]);

    return formatData({
        shared: sharedEncryptedPart,
        sharedSessionKey: encryptedSharedSessionKey,
        calendar: calendarEncryptedPart,
        calendarSessionKey: encryptedCalendarSessionKey,
        personalSigned,
        attendeesEncrypted: attendeesEncryptedPart,
        attendees: attendeesPart[CLEAR]
    });
};
