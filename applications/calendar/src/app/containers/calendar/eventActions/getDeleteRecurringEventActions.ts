import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { getIsEventCancelled } from '../../../helpers/event';
import getUpdatePartstatOperation, { UpdatePartstatOperation } from '../getUpdatePartstatOperation';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import deleteSingleRecurrence from '../recurrence/deleteSingleRecurrence';
import { RECURRING_TYPES } from '../../../constants';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import { INVITE_ACTION_TYPES, InviteActions, SendIcsActionData } from '../../../interfaces/Invite';
import {
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';

interface DeleteRecurringArguments {
    type: RECURRING_TYPES;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    isInvitation: boolean;
    inviteActions: InviteActions;
    selfAttendeeToken?: string;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
}

export const getDeleteRecurringEventActions = async ({
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
    oldEditEventData: { eventData: oldEvent, veventComponent: oldVeventComponent },
    isInvitation,
    inviteActions,
    selfAttendeeToken,
    sendIcs,
}: DeleteRecurringArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
}> => {
    const { type: inviteType, sendCancellationNotice, resetSingleEditsPartstat } = inviteActions;
    const isDeclineInvitation = inviteType === INVITE_ACTION_TYPES.DECLINE_INVITATION && sendCancellationNotice;
    const isCancelInvitation = inviteType === INVITE_ACTION_TYPES.CANCEL_INVITATION;
    let updatedInviteActions = inviteActions;

    if (type === RECURRING_TYPES.SINGLE) {
        if (!originalVeventComponent) {
            throw new Error('Can not delete single occurrence without original event');
        }

        const isSingleEdit = oldEvent.ID !== originalEvent.ID;
        if (isSingleEdit && isDeclineInvitation) {
            const { inviteActions: cleanInviteActions } = await sendIcs({
                inviteActions,
                vevent: oldVeventComponent,
            });
            updatedInviteActions = cleanInviteActions;
        }
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
            inviteActions: updatedInviteActions,
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
            inviteActions,
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        if (!recurrences.length) {
            throw new Error('Can not delete all events without any recurrences');
        }
        if (isDeclineInvitation || isCancelInvitation) {
            const { inviteActions: cleanInviteActions } = await sendIcs({
                inviteActions,
                vevent: originalVeventComponent,
                cancelVevent: originalVeventComponent,
            });
            updatedInviteActions = cleanInviteActions;
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
            inviteActions: updatedInviteActions,
            updatePartstatActions: resetPartstatOperations,
        };
    }

    throw new Error('Unknown delete type');
};
