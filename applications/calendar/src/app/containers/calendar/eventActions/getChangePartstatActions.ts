import { getUnixTime } from 'date-fns';
import { toIcsPartstat } from 'proton-shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { getAttendeeToken, getHasAttendees } from 'proton-shared/lib/calendar/vcalHelper';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { CalendarEvent, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import {
    InviteActions,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import { SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { getUpdatePersonalPartOperation } from './getUpdatePersonalPartActions';

const { ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

export const getUpdatePartstatOperation = ({
    eventComponent,
    event,
    inviteActions,
    memberID,
    timestamp,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    inviteActions: InviteActions;
    memberID: string;
    timestamp: number;
}) => {
    const { partstat, selfAttendeeIndex } = inviteActions;
    if (selfAttendeeIndex === undefined || !partstat || !getHasAttendees(eventComponent)) {
        return;
    }
    const token = eventComponent.attendee[selfAttendeeIndex]?.parameters?.['x-pm-token'];
    const attendeeID = event.Attendees.find(({ Token }) => Token === token)?.ID;
    if (!attendeeID) {
        return;
    }
    return {
        data: {
            memberID,
            calendarID: event.CalendarID,
            eventID: event.ID,
            attendeeID,
            partstat,
            updateTime: getUnixTime(timestamp),
        },
    };
};

const getAutoUpdatePersonalPartOperation = ({
    eventComponent,
    event,
    inviteActions,
    memberID,
    addressID,
    partstat,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    inviteActions: InviteActions;
    memberID: string;
    addressID: string;
    partstat: ICAL_ATTENDEE_STATUS;
}) => {
    const { selfAddress, selfAttendeeIndex } = inviteActions;
    if (selfAttendeeIndex === undefined || !selfAddress || !getHasAttendees(eventComponent)) {
        return;
    }
    const token = getAttendeeToken(eventComponent.attendee[selfAttendeeIndex]);
    const oldAttendee = event.Attendees.find(({ Token }) => Token === token);
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
        event,
        memberID,
        addressID,
    });
};

interface ChangePartstaActionsArguments {
    inviteActions: InviteActions;
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    memberID: string;
    addressID: string;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions; timestamp: number }>;
}
const getChangePartstatActions = async ({
    inviteActions,
    eventComponent,
    event,
    memberID,
    addressID,
    sendIcs,
}: ChangePartstaActionsArguments): Promise<{
    inviteActions: InviteActions;
    multiSyncActions: SyncEventActionOperations[];
    updatePartstatActions: UpdatePartstatOperation[];
    updatePersonalPartActions: UpdatePersonalPartOperation[];
}> => {
    const { partstat } = inviteActions;
    if (!partstat) {
        throw new Error('Cannot update participation status without new answer');
    }
    const { timestamp } = await sendIcs({ inviteActions, vevent: eventComponent });
    const partstatOperation = getUpdatePartstatOperation({
        eventComponent,
        event,
        inviteActions,
        memberID,
        timestamp,
    });
    if (!partstatOperation) {
        throw new Error('Failed to generate change partstat operation');
    }
    const personalPartOperation = getAutoUpdatePersonalPartOperation({
        eventComponent,
        event,
        inviteActions,
        memberID,
        addressID,
        partstat,
    });
    return {
        inviteActions,
        multiSyncActions: [],
        updatePartstatActions: [partstatOperation],
        updatePersonalPartActions: [personalPartOperation].filter(isTruthy),
    };
};

export default getChangePartstatActions;
