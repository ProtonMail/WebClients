import { getUnixTime } from 'date-fns';

import { serverTime } from '@proton/crypto';
import { toIcsPartstat } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getAttendeeToken, getHasAttendees } from '@proton/shared/lib/calendar/vcalHelper';
import type { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
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

export const getUpdatePartstatOperation = ({
    eventComponent,
    event,
    inviteActions,
    timestamp,
    silence,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    inviteActions: InviteActions;
    timestamp: number;
    silence: boolean;
}): UpdatePartstatOperation | undefined => {
    const { partstat, selfAttendeeIndex, comment } = inviteActions;
    if (selfAttendeeIndex === undefined || !partstat || !getHasAttendees(eventComponent)) {
        return;
    }
    const token = eventComponent.attendee[selfAttendeeIndex]?.parameters?.['x-pm-token'];
    const attendeeID = event.AttendeesInfo?.Attendees?.find(({ Token }) => Token === token)?.ID;
    if (!attendeeID) {
        return;
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
    eventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
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
    const partstatOperation = getUpdatePartstatOperation({
        eventComponent,
        event,
        inviteActions,
        timestamp,
        silence: false,
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
