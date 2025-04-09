import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';

import type { SimpleMap } from '../interfaces';
import type { AttendeeComment, VcalVeventComponent } from '../interfaces/calendar';
import { CALENDAR_CARD_TYPE } from './constants';
import {
    createSessionKey,
    encryptPart,
    getEncryptedSessionKey,
    getEncryptedSessionKeysMap,
    signPart,
} from './crypto/encrypt';
import { formatData } from './formatData';
import { getVeventParts } from './veventHelper';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

/**
 * Split the properties of the component into parts.
 */
const getParts = (eventComponent: VcalVeventComponent) => {
    return getVeventParts(eventComponent);
};

/**
 * Create a calendar event by encrypting and serializing an internal vcal component.
 */
interface CreateCalendarEventArguments {
    eventComponent: VcalVeventComponent;
    cancelledOccurrenceVevent?: VcalVeventComponent;
    publicKey: PublicKeyReference;
    privateKey: PrivateKeyReference;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    isCreateEvent: boolean;
    isSwitchCalendar: boolean;
    hasDefaultNotifications: boolean;
    isAttendee?: boolean;
    removedAttendeesEmails?: string[];
    addedAttendeesPublicKeysMap?: SimpleMap<PublicKeyReference>;
    getAttendeesCommentsMap?: (sharedSessionKey: SessionKey) => Promise<{
        [attendeeToken: string]: AttendeeComment;
    }>;
}
export const createCalendarEvent = async ({
    eventComponent,
    cancelledOccurrenceVevent,
    publicKey,
    privateKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey,
    isCreateEvent,
    isSwitchCalendar,
    hasDefaultNotifications,
    isAttendee,
    removedAttendeesEmails = [],
    addedAttendeesPublicKeysMap,
    getAttendeesCommentsMap,
}: CreateCalendarEventArguments) => {
    const { sharedPart, calendarPart, notificationsPart, attendeesPart } = getParts(eventComponent);
    const cancelledOccurrenceSharedPart = cancelledOccurrenceVevent
        ? getParts(cancelledOccurrenceVevent).sharedPart
        : undefined;

    const isCreateOrSwitchCalendar = isCreateEvent || isSwitchCalendar;
    const isAttendeeSwitchingCalendar = isSwitchCalendar && isAttendee;
    // If there is no encrypted calendar part, a calendar session key is not needed.
    const shouldHaveCalendarKey = !!calendarPart[ENCRYPTED_AND_SIGNED];

    const [calendarSessionKey, sharedSessionKey] = await Promise.all([
        shouldHaveCalendarKey ? oldCalendarSessionKey || createSessionKey(publicKey) : undefined,
        oldSharedSessionKey || createSessionKey(publicKey),
    ]);

    const eventCommentsMap = getAttendeesCommentsMap ? await getAttendeesCommentsMap(sharedSessionKey) : undefined;

    const [
        encryptedCalendarSessionKey,
        encryptedSharedSessionKey,
        sharedSignedPart,
        sharedEncryptedPart,
        calendarSignedPart,
        calendarEncryptedPart,
        attendeesEncryptedPart,
        attendeesEncryptedSessionKeysMap,
        cancelledOccurrenceSignedPart,
    ] = await Promise.all([
        // If we're updating an event (but not switching calendar), no need to encrypt again the session keys
        isCreateOrSwitchCalendar && calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, publicKey)
            : undefined,
        isCreateOrSwitchCalendar ? getEncryptedSessionKey(sharedSessionKey, publicKey) : undefined,
        // attendees are not allowed to change the SharedEventContent, so they shouldn't send it (API will complain otherwise)
        isAttendeeSwitchingCalendar ? undefined : signPart(sharedPart[SIGNED], privateKey),
        isAttendeeSwitchingCalendar
            ? undefined
            : encryptPart(sharedPart[ENCRYPTED_AND_SIGNED], privateKey, sharedSessionKey),
        signPart(calendarPart[SIGNED], privateKey),
        calendarSessionKey
            ? encryptPart(calendarPart[ENCRYPTED_AND_SIGNED], privateKey, calendarSessionKey)
            : undefined,
        // attendees are not allowed to change the SharedEventContent, so they shouldn't send it (API will complain otherwise)
        isAttendeeSwitchingCalendar
            ? undefined
            : encryptPart(attendeesPart[ENCRYPTED_AND_SIGNED], privateKey, sharedSessionKey),
        getEncryptedSessionKeysMap(sharedSessionKey, addedAttendeesPublicKeysMap),
        cancelledOccurrenceSharedPart ? signPart(cancelledOccurrenceSharedPart[SIGNED], privateKey) : undefined,
    ]);

    return formatData({
        sharedSignedPart,
        sharedEncryptedPart,
        cancelledOccurrenceSignedPart,
        sharedSessionKey: encryptedSharedSessionKey,
        calendarSignedPart,
        calendarEncryptedPart,
        calendarSessionKey: encryptedCalendarSessionKey,
        notificationsPart: hasDefaultNotifications ? undefined : notificationsPart,
        colorPart: eventComponent.color?.value,
        attendeesEncryptedPart,
        attendeesClearPart: isAttendeeSwitchingCalendar ? undefined : attendeesPart[CLEAR_TEXT],
        removedAttendeesEmails,
        attendeesEncryptedSessionKeysMap,
        eventCommentsMap,
    });
};
