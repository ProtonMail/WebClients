import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { CalendarCreateEventBlobData } from '../interfaces/calendar/Api';
import { RequireSome, SimpleMap } from '../interfaces/utils';

import { CALENDAR_CARD_TYPE } from './constants';
import { getVeventParts } from './veventHelper';
import { createSessionKey, encryptPart, getEncryptedSessionKey, getEncryptedSessionKeysMap, signPart } from './encrypt';
import { SignPartResult, VcalVeventComponent } from '../interfaces/calendar';
import { getIsEventComponent } from './vcalHelper';
import { formatData, getArmoredSignatureString } from './formatData';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

export const getHasSharedEventContent = (
    data: Partial<CalendarCreateEventBlobData>
): data is RequireSome<CalendarCreateEventBlobData, 'SharedEventContent'> => !!data.SharedEventContent;

export const getHasSharedKeyPacket = (
    data: CalendarCreateEventBlobData
): data is RequireSome<CalendarCreateEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;

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
    publicKey: OpenPGPKey;
    privateKey: OpenPGPKey;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    isCreateEvent: boolean;
    isSwitchCalendar: boolean;
    isInvitation?: boolean;
    removedAttendeesEmails?: string[];
    addedAttendeesPublicKeysMap?: SimpleMap<OpenPGPKey>;
}
export const createCalendarEvent = async ({
    eventComponent,
    publicKey,
    privateKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey,
    isCreateEvent,
    isSwitchCalendar,
    isInvitation,
    removedAttendeesEmails = [],
    addedAttendeesPublicKeysMap,
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
        attendeesEncryptedSessionKeysMap,
    ] = await Promise.all([
        // If we're updating an event (but not switching calendar), no need to encrypt again the session keys
        isCreateOrSwitchCalendar && calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, publicKey)
            : undefined,
        isCreateOrSwitchCalendar ? getEncryptedSessionKey(sharedSessionKey, publicKey) : undefined,
        // attendees are not allowed to change the SharedEventContent, so they shouldn't send it (API will complain otherwise)
        isSwitchCalendarOfInvitation ? undefined : signPart(sharedPart[SIGNED], privateKey),
        isSwitchCalendarOfInvitation
            ? undefined
            : encryptPart(sharedPart[ENCRYPTED_AND_SIGNED], privateKey, sharedSessionKey),
        signPart(calendarPart[SIGNED], privateKey),
        calendarSessionKey && encryptPart(calendarPart[ENCRYPTED_AND_SIGNED], privateKey, calendarSessionKey),
        signPart(personalPart[SIGNED], privateKey),
        // attendees are not allowed to change the SharedEventContent, so they shouldn't send it (API will complain otherwise)
        isSwitchCalendarOfInvitation
            ? undefined
            : encryptPart(attendeesPart[ENCRYPTED_AND_SIGNED], privateKey, sharedSessionKey),
        getEncryptedSessionKeysMap(sharedSessionKey, addedAttendeesPublicKeysMap),
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
        removedAttendeesEmails,
        attendeesEncryptedSessionKeysMap,
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
