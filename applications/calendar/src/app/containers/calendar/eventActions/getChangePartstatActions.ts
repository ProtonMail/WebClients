import { getUnixTime } from 'date-fns';

import { CryptoProxy, serverTime } from '@proton/crypto';
import { toIcsPartstat } from '@proton/shared/lib/calendar/attendees';
import { ATTENDEE_COMMENT_ENCRYPTION_TYPE, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getSignatureContext } from '@proton/shared/lib/calendar/crypto/helpers';
import { getSharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { getAttendeeToken, getHasAttendees } from '@proton/shared/lib/calendar/vcalHelper';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetCalendarKeys';
import isTruthy from '@proton/utils/isTruthy';

import type {
    InviteActions,
    ReencryptInviteActionData,
    SendIcs,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import type { SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { getUpdatePersonalPartOperation } from './getUpdatePersonalPartActions';

const { ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

export const getUpdatePartstatOperation = async ({
    eventComponent,
    event,
    inviteActions,
    timestamp,
    silence,
    addressID,
    getAddressKeys,
    getCalendarKeys,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    inviteActions: InviteActions;
    timestamp: number;
    silence: boolean;
    addressID: string;
    getCalendarKeys: GetCalendarKeys;
    getAddressKeys: GetAddressKeys;
}): Promise<UpdatePartstatOperation | undefined> => {
    const { partstat, selfAttendeeIndex, comment: maybeClearComment } = inviteActions;
    if (selfAttendeeIndex === undefined || !partstat || !getHasAttendees(eventComponent)) {
        return;
    }
    const token = eventComponent.attendee[selfAttendeeIndex]?.parameters?.['x-pm-token'];
    const attendeeID = event.AttendeesInfo?.Attendees?.find(({ Token }) => Token === token)?.ID;
    if (!attendeeID) {
        return;
    }

    let comment = maybeClearComment;
    if (comment?.Message && comment?.Type === ATTENDEE_COMMENT_ENCRYPTION_TYPE.ENCRYPTED) {
        const sessionKey = await getSharedSessionKey({ calendarEvent: event, getAddressKeys, getCalendarKeys });
        const [signingKey] = await getAddressKeys(addressID);

        // Signature will be inside message.
        const encryptResult = await CryptoProxy.encryptMessage({
            // TODO sanitize the message before
            textData: comment?.Message,
            signingKeys: [signingKey.privateKey],
            signatureContext: { value: getSignatureContext('calendar.rsvp.comment', event.ID), critical: true },
            sessionKey,
            format: 'binary',
        });

        const base64EncryptedComment = uint8ArrayToBase64String(encryptResult.message);

        comment = {
            Message: base64EncryptedComment,
            Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.ENCRYPTED,
        };
    }

    return {
        data: {
            calendarID: event.CalendarID,
            eventID: event.ID,
            attendeeID,
            partstat,
            comment,
            updateTime: getUnixTime(timestamp),
        },
        silence,
    };
};

const getAutoUpdatePersonalPartOperation = ({
    eventComponent,
    hasDefaultNotifications,
    event,
    inviteActions,
    addressID,
    partstat,
}: {
    /** Allow to find the attendee Token */
    eventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    /**
     * TODO: Remove or correct this comment.
     * Seem to be old event
     */
    event: CalendarEvent;
    inviteActions: InviteActions;
    addressID: string;
    partstat: ICAL_ATTENDEE_STATUS;
}): UpdatePersonalPartOperation | undefined => {
    const { selfAddress, selfAttendeeIndex } = inviteActions;
    if (selfAttendeeIndex === undefined || !selfAddress || !getHasAttendees(eventComponent)) {
        return;
    }
    const token = getAttendeeToken(eventComponent.attendee[selfAttendeeIndex]);
    const oldAttendee = event.AttendeesInfo.Attendees.find(({ Token }) => Token === token);
    if (!oldAttendee) {
        return;
    }
    const oldPartstat = toIcsPartstat(oldAttendee.Status);

    if (
        oldPartstat === partstat ||
        (partstat === ACCEPTED && oldPartstat === TENTATIVE) ||
        (partstat === TENTATIVE && oldPartstat === ACCEPTED)
    ) {
        // no need to update the notifications in such cases
        return;
    }

    return getUpdatePersonalPartOperation({
        eventComponent,
        hasDefaultNotifications,
        event,
        addressID,
    });
};

interface ChangePartstaActionsArguments {
    inviteActions: InviteActions;
    eventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    event: CalendarEvent;
    addressID: string;
    reencryptionCalendarID?: string;
    sendIcs: SendIcs;
    reencryptSharedEvent: (data: ReencryptInviteActionData) => Promise<void>;
    getCalendarKeys: GetCalendarKeys;
    getAddressKeys: GetAddressKeys;
}
const getChangePartstatActions = async ({
    inviteActions,
    eventComponent,
    hasDefaultNotifications,
    event,
    addressID,
    reencryptionCalendarID,
    sendIcs,
    reencryptSharedEvent,
    getAddressKeys,
    getCalendarKeys,
}: ChangePartstaActionsArguments): Promise<{
    inviteActions: InviteActions;
    multiSyncActions: SyncEventActionOperations[];
    updatePartstatActions: UpdatePartstatOperation[];
    updatePersonalPartActions: UpdatePersonalPartOperation[];
    sendActions?: SendIcsActionData[];
}> => {
    const { partstat, isProtonProtonInvite } = inviteActions;
    // Re-encrypt shared event first if needed
    if (reencryptionCalendarID) {
        await reencryptSharedEvent({ calendarEvent: event, calendarID: reencryptionCalendarID });
    }

    if (!partstat) {
        throw new Error('Cannot update participation status without new answer');
    }
    // For Proton to Proton invites, we send the email after changing the answer
    const timestamp = isProtonProtonInvite
        ? +serverTime()
        : (await sendIcs({ inviteActions, vevent: eventComponent })).timestamp;
    const partstatOperation = await getUpdatePartstatOperation({
        addressID,
        eventComponent,
        event,
        inviteActions,
        timestamp,
        silence: false,
        getAddressKeys,
        getCalendarKeys,
    });
    if (!partstatOperation) {
        throw new Error('Failed to generate change partstat operation');
    }
    const personalPartOperation = getAutoUpdatePersonalPartOperation({
        eventComponent,
        hasDefaultNotifications,
        event,
        inviteActions,
        addressID,
        partstat,
    });

    return {
        inviteActions,
        multiSyncActions: [],
        updatePartstatActions: [partstatOperation],
        updatePersonalPartActions: [personalPartOperation].filter(isTruthy),
        sendActions: isProtonProtonInvite ? [{ inviteActions, vevent: eventComponent }] : undefined,
    };
};

export default getChangePartstatActions;
