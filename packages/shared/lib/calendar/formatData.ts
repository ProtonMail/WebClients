import { OpenPGPSignature } from 'pmcrypto';
import { EncryptPartResult, SignPartResult } from '../interfaces/calendar/PartResult';
import { AttendeeClearPartResult } from '../interfaces/calendar/Attendee';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import isTruthy from '../helpers/isTruthy';
import { CALENDAR_CARD_TYPE } from './constants';

const { ENCRYPTED_AND_SIGNED, SIGNED } = CALENDAR_CARD_TYPE;

// Wrong typings in openpgp.d.ts...
export const getArmoredSignatureString = (signature: OpenPGPSignature) => (signature.armor() as unknown) as string;

/**
 * Format the data into what the API expects.
 */
interface FormatDataArguments {
    sharedSignedPart?: SignPartResult;
    sharedEncryptedPart?: EncryptPartResult;
    sharedSessionKey?: Uint8Array;
    calendarSignedPart?: SignPartResult;
    calendarEncryptedPart?: EncryptPartResult;
    calendarSessionKey?: Uint8Array;
    personalSignedPart?: SignPartResult;
    attendeesEncryptedPart?: EncryptPartResult;
    attendeesClearPart?: AttendeeClearPartResult[];
    removedAttendees?: string[];
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
    attendeesClearPart,
    removedAttendees,
}: FormatDataArguments) => {
    return {
        SharedKeyPacket: sharedSessionKey ? uint8ArrayToBase64String(sharedSessionKey) : undefined,
        SharedEventContent:
            sharedSignedPart && sharedEncryptedPart
                ? [
                      {
                          Type: SIGNED,
                          Data: sharedSignedPart.data,
                          Signature: getArmoredSignatureString(sharedSignedPart.signature),
                      },
                      {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: uint8ArrayToBase64String(sharedEncryptedPart.dataPacket),
                          Signature: getArmoredSignatureString(sharedEncryptedPart.signature),
                      },
                  ]
                : undefined,
        CalendarKeyPacket:
            calendarEncryptedPart && calendarSessionKey ? uint8ArrayToBase64String(calendarSessionKey) : undefined,
        CalendarEventContent:
            calendarSignedPart || calendarEncryptedPart
                ? [
                      // Calendar parts are optional
                      calendarSignedPart && {
                          Type: SIGNED,
                          Data: calendarSignedPart.data,
                          Signature: getArmoredSignatureString(calendarSignedPart.signature),
                      },
                      calendarEncryptedPart && {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: uint8ArrayToBase64String(calendarEncryptedPart.dataPacket),
                          Signature: getArmoredSignatureString(calendarEncryptedPart.signature),
                      },
                  ].filter(isTruthy)
                : undefined,
        // Personal part is optional
        PersonalEventContent: personalSignedPart
            ? {
                  Type: SIGNED,
                  Data: personalSignedPart.data,
                  Signature: getArmoredSignatureString(personalSignedPart.signature),
              }
            : undefined,
        AttendeesEventContent: attendeesEncryptedPart
            ? [
                  {
                      Type: ENCRYPTED_AND_SIGNED,
                      Data: uint8ArrayToBase64String(attendeesEncryptedPart.dataPacket),
                      Signature: getArmoredSignatureString(attendeesEncryptedPart.signature),
                  },
              ]
            : undefined,
        Attendees: attendeesClearPart
            ? attendeesClearPart.map(({ token, status }) => ({
                  Token: token,
                  Status: status,
              }))
            : undefined,
        RemovedAttendeeAddresses: removedAttendees?.length ? removedAttendees : undefined,
    };
};
