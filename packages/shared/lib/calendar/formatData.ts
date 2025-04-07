import type {
    AttendeeComment,
    CalendarNotificationSettings,
    CreateOrUpdateCalendarEventData,
} from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import { uint8ArrayToBase64String } from '../helpers/encoding';
import type { SimpleMap } from '../interfaces';
import type { AttendeeClearPartResult } from '../interfaces/calendar/Attendee';
import type { EncryptPartResult, SignPartResult } from '../interfaces/calendar/PartResult';
import { CALENDAR_CARD_TYPE } from './constants';

const { ENCRYPTED_AND_SIGNED, SIGNED } = CALENDAR_CARD_TYPE;

/**
 * Format the data into what the API expects.
 */
interface FormatDataArguments {
    sharedSignedPart?: SignPartResult;
    sharedEncryptedPart?: EncryptPartResult;
    sharedSessionKey?: Uint8Array;
    cancelledOccurrenceSignedPart?: SignPartResult;
    calendarSignedPart?: SignPartResult;
    calendarEncryptedPart?: EncryptPartResult;
    calendarSessionKey?: Uint8Array;
    attendeesEncryptedPart?: EncryptPartResult;
    attendeesClearPart?: AttendeeClearPartResult[];
    removedAttendeesEmails?: string[];
    attendeesEncryptedSessionKeysMap?: SimpleMap<Uint8Array>;
    notificationsPart?: CalendarNotificationSettings[];
    colorPart?: string;
    eventCommentsMap?: { [token: string]: AttendeeComment };
}
export const formatData = ({
    sharedSignedPart,
    sharedEncryptedPart,
    sharedSessionKey,
    cancelledOccurrenceSignedPart,
    calendarSignedPart,
    calendarEncryptedPart,
    calendarSessionKey,
    notificationsPart,
    colorPart,
    attendeesEncryptedPart,
    attendeesClearPart,
    removedAttendeesEmails,
    attendeesEncryptedSessionKeysMap,
    eventCommentsMap,
}: FormatDataArguments) => {
    const result: Omit<CreateOrUpdateCalendarEventData, 'Permissions'> = {
        Notifications: notificationsPart || null,
        Color: colorPart || null,
    };

    if (sharedSessionKey) {
        result.SharedKeyPacket = uint8ArrayToBase64String(sharedSessionKey);
    }

    if (sharedSignedPart && sharedEncryptedPart) {
        result.SharedEventContent = [
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
        ];
    }

    if (cancelledOccurrenceSignedPart) {
        result.CancelledOccurrenceContent = [
            {
                Type: SIGNED,
                Data: cancelledOccurrenceSignedPart.data,
                Signature: cancelledOccurrenceSignedPart.signature,
            },
        ];
    }

    if (calendarEncryptedPart && calendarSessionKey) {
        result.CalendarKeyPacket = uint8ArrayToBase64String(calendarSessionKey);
    }

    if (calendarSignedPart || calendarEncryptedPart) {
        result.CalendarEventContent = [
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
        ].filter(isTruthy);
    }

    if (attendeesEncryptedPart) {
        result.AttendeesEventContent = [
            {
                Type: ENCRYPTED_AND_SIGNED,
                Data: uint8ArrayToBase64String(attendeesEncryptedPart.dataPacket),
                Signature: attendeesEncryptedPart.signature,
            },
        ];
    }

    if (attendeesClearPart) {
        result.Attendees = attendeesClearPart.map(({ token, status }) => ({
            Token: token,
            Status: status,
            Comment: eventCommentsMap?.[token] || null,
        }));
    }

    if (removedAttendeesEmails?.length) {
        result.RemovedAttendeeAddresses = removedAttendeesEmails;
    }

    if (attendeesEncryptedSessionKeysMap) {
        result.AddedProtonAttendees = Object.keys(attendeesEncryptedSessionKeysMap)
            .map((email) => {
                const sharedEncryptedSessionKey = attendeesEncryptedSessionKeysMap[email];
                if (!sharedEncryptedSessionKey) {
                    return;
                }
                return { Email: email, AddressKeyPacket: uint8ArrayToBase64String(sharedEncryptedSessionKey) };
            })
            .filter(isTruthy);
    }

    return result;
};
