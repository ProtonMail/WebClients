import isTruthy from '@proton/utils/isTruthy';
import { SimpleMap } from '../interfaces';
import { EncryptPartResult, SignPartResult } from '../interfaces/calendar/PartResult';
import { AttendeeClearPartResult } from '../interfaces/calendar/Attendee';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import { CALENDAR_CARD_TYPE } from './constants';

const { ENCRYPTED_AND_SIGNED, SIGNED } = CALENDAR_CARD_TYPE;

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
    removedAttendeesEmails?: string[];
    attendeesEncryptedSessionKeysMap?: SimpleMap<Uint8Array>;
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
    removedAttendeesEmails,
    attendeesEncryptedSessionKeysMap,
}: FormatDataArguments) => {
    return {
        SharedKeyPacket: sharedSessionKey ? uint8ArrayToBase64String(sharedSessionKey) : undefined,
        SharedEventContent:
            sharedSignedPart && sharedEncryptedPart
                ? [
                      {
                          Type: SIGNED,
                          Data: sharedSignedPart.data,
                          Signature: sharedSignedPart.signature,
                      },
                      {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: uint8ArrayToBase64String(sharedEncryptedPart.dataPacket),
                          Signature: sharedEncryptedPart.signature,
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
                          Signature: calendarSignedPart.signature,
                      },
                      calendarEncryptedPart && {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: uint8ArrayToBase64String(calendarEncryptedPart.dataPacket),
                          Signature: calendarEncryptedPart.signature,
                      },
                  ].filter(isTruthy)
                : undefined,
        // Personal part is optional
        PersonalEventContent: personalSignedPart
            ? {
                  Type: SIGNED,
                  Data: personalSignedPart.data,
                  Signature: personalSignedPart.signature,
              }
            : undefined,
        AttendeesEventContent: attendeesEncryptedPart
            ? [
                  {
                      Type: ENCRYPTED_AND_SIGNED,
                      Data: uint8ArrayToBase64String(attendeesEncryptedPart.dataPacket),
                      Signature: attendeesEncryptedPart.signature,
                  },
              ]
            : undefined,
        Attendees: attendeesClearPart
            ? attendeesClearPart.map(({ token, status }) => ({
                  Token: token,
                  Status: status,
              }))
            : undefined,
        RemovedAttendeeAddresses: removedAttendeesEmails?.length ? removedAttendeesEmails : undefined,
        AddedProtonAttendees: attendeesEncryptedSessionKeysMap
            ? Object.keys(attendeesEncryptedSessionKeysMap)
                  .map((email) => {
                      const sharedSessionKey = attendeesEncryptedSessionKeysMap[email];
                      if (!sharedSessionKey) {
                          return;
                      }
                      return { Email: email, AddressKeyPacket: uint8ArrayToBase64String(sharedSessionKey) };
                  })
                  .filter(isTruthy)
            : undefined,
    };
};
