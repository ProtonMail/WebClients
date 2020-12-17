import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { getIsEventCancelled } from '../../../helpers/event';
import getUpdatePartstatOperation, { UpdatePartstatOperation } from '../getUpdatePartstatOperation';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import deleteSingleRecurrence from '../recurrence/deleteSingleRecurrence';
import { RECURRING_TYPES } from '../../../constants';
import {
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import { InviteActions } from './inviteActions';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';

interface DeleteRecurringArguments {
    type: RECURRING_TYPES;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    isInvitation: boolean;
    inviteActions: InviteActions;
    selfAttendeeToken?: string;
}

export const getDeleteRecurringEventActions = ({
    type,
    recurrence,
    recurrences,
    originalEditEventData: {
        veventComponent: originalVeventComponent,
        eventData: originalEvent,
        calendarID: originalCalendarID,
        addressID: originalAddressID,
        memberID: originalMemberID,
    },
    oldEditEventData: { eventData: oldEvent },
    isInvitation,
    inviteActions,
    selfAttendeeToken,
}: DeleteRecurringArguments): {
    multiSyncActions: SyncEventActionOperations[];
    updatePartstatActions?: UpdatePartstatOperation[];
} => {
    const { resetSingleEditsPartstat } = inviteActions;
    if (type === RECURRING_TYPES.SINGLE) {
        if (!originalVeventComponent) {
            throw new Error('Can not delete single occurrence without original event');
        }

        const isSingleEdit = oldEvent.ID !== originalEvent.ID;
        const updatedVeventComponent = deleteSingleRecurrence(originalVeventComponent, recurrence.localStart);

        const singleDeleteOperation = isSingleEdit ? getDeleteSyncOperation(oldEvent) : undefined;

        const originalExdateOperation = getUpdateSyncOperation(updatedVeventComponent, originalEvent);

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [singleDeleteOperation, originalExdateOperation].filter(isTruthy),
                },
            ],
        };
    }

    if (type === RECURRING_TYPES.FUTURE) {
        if (!originalVeventComponent || !recurrences.length) {
            throw new Error('Can not delete future recurrences without the original event');
        }

        const updatedVeventComponent = deleteFutureRecurrence(
            originalVeventComponent,
            recurrence.localStart,
            recurrence.occurrenceNumber
        );

        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        const deleteOperations = singleEditRecurrencesAfter.map(getDeleteSyncOperation);
        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, originalEvent);

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...deleteOperations, updateOperation],
                },
            ],
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        if (!recurrences.length) {
            throw new Error('Can not delete all events without any recurrences');
        }
        // For invitations we do not delete single edits, but reset partstat if necessary
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        const eventsToDelete = isInvitation
            ? [originalEvent].concat(singleEditRecurrences.filter((event) => getIsEventCancelled(event)))
            : recurrences;
        const deleteOperations = eventsToDelete.map(getDeleteSyncOperation);
        const resetPartstatOperations =
            isInvitation && resetSingleEditsPartstat
                ? singleEditRecurrences.map((event) =>
                      getUpdatePartstatOperation({
                          event,
                          token: selfAttendeeToken,
                          partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                      })
                  )
                : [];
        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: deleteOperations,
                },
            ],
            updatePartstatActions: resetPartstatOperations,
        };
    }

    throw new Error('Unknown delete type');
};
