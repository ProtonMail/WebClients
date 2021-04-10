import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { CalendarEventBlobData } from '../api/calendars';
import { RequireSome } from '../interfaces/utils';

import { CALENDAR_CARD_TYPE } from './constants';
import { getVeventParts } from './veventHelper';
import { createSessionKey, encryptPart, getEncryptedSessionKey, signPart } from './encrypt';
import { SignPartResult, VcalVeventComponent } from '../interfaces/calendar';
import { getIsEventComponent } from './vcalHelper';
import { formatData, getArmoredSignatureString } from './formatData';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

export const getHasSharedEventContent = (
    data: Partial<CalendarEventBlobData>
): data is RequireSome<CalendarEventBlobData, 'SharedEventContent'> => !!data.SharedEventContent;

export const getHasSharedKeyPacket = (
    data: CalendarEventBlobData
): data is RequireSome<CalendarEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;

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
    isCreateEvent: boolean;
    isSwitchCalendar: boolean;
    isInvitation?: boolean;
}
export const createCalendarEvent = async ({
    eventComponent,
    privateKey,
    publicKey,
    signingKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey,
    isCreateEvent,
    isSwitchCalendar,
    isInvitation,
}: CreateCalendarEventArguments) => {
    const { sharedPart, calendarPart, personalPart, attendeesPart } = getParts(eventComponent);

    const isCreateOrSwitchCalendar = isCreateEvent || isSwitchCalendar;
    const isSwitchCalendarOfInvitation = isSwitchCalendar && isInvitation;
    // If there is no encrypted calendar part, a calendar session key is not needed.
    const shouldHaveCalendarKey = !!calendarPart[ENCRYPTED_AND_SIGNED];

    const [calendarSessionKey, sharedSessionKey] = await Promise.all([
        shouldHaveCalendarKey ? oldCalendarSessionKey || createSessionKey(publicKey) : undefined,
        oldSharedSessionKey || createSessionKey(publicKey),
    ]);

    const [
        encryptedCalendarSessionKey,
        encryptedSharedSessionKey,
        sharedSignedPart,
        sharedEncryptedPart,
        calendarSignedPart,
        calendarEncryptedPart,
        personalSignedPart,
        attendeesEncryptedPart,
    ] = await Promise.all([
        // If we're updating an event (but not switching calendar), no need to encrypt again the session keys
        isCreateOrSwitchCalendar && calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, privateKey)
            : undefined,
        isCreateOrSwitchCalendar ? getEncryptedSessionKey(sharedSessionKey, privateKey) : undefined,
        // attendees are not allowed to change the SharedEventContent, so they shouldn't send it (API will complain otherwise)
        isSwitchCalendarOfInvitation ? undefined : signPart(sharedPart[SIGNED], signingKey),
        isSwitchCalendarOfInvitation
            ? undefined
            : encryptPart(sharedPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey),
        signPart(calendarPart[SIGNED], signingKey),
        calendarSessionKey && encryptPart(calendarPart[ENCRYPTED_AND_SIGNED], signingKey, calendarSessionKey),
        signPart(personalPart[SIGNED], signingKey),
        // attendees are not allowed to change the SharedEventContent, so they shouldn't send it (API will complain otherwise)
        isSwitchCalendarOfInvitation
            ? undefined
            : encryptPart(attendeesPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey),
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
        attendeesClearPart: isSwitchCalendarOfInvitation ? undefined : attendeesPart[CLEAR_TEXT],
    });
};

/**
 * Format just the personal data into what the API expects.
 */
export const formatPersonalData = (personalSignedPart?: SignPartResult) => {
    if (!personalSignedPart) {
        return;
    }
    return {
        Type: SIGNED,
        Data: personalSignedPart.data,
        Signature: getArmoredSignatureString(personalSignedPart.signature),
    };
};

/**
 * Create just the personal event from an internal vcal component.
 */
interface CreatePersonalEventArguments {
    eventComponent: VcalVeventComponent;
    signingKey: OpenPGPKey;
}
export const createPersonalEvent = async ({ eventComponent, signingKey }: CreatePersonalEventArguments) => {
    const { personalPart } = getParts(eventComponent);

    const personalSignedPart = await signPart(personalPart[SIGNED], signingKey);

    return formatPersonalData(personalSignedPart);
};
