import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from 'proton-shared/lib/calendar/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';

import { getResetPartstatActions } from 'proton-shared/lib/calendar/integration/invite';
import { getIsEventCancelled } from 'proton-shared/lib/calendar/veventHelper';
import {
    INVITE_ACTION_TYPES,
    InviteActions,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import {
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import { getUpdatePartstatOperation } from './getChangePartstatActions';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import deleteSingleRecurrence from '../recurrence/deleteSingleRecurrence';

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
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions; timestamp: number }>;
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
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
}> => {
    const { type: inviteType, sendCancellationNotice, deleteSingleEdits } = inviteActions;
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
        const updatePartstatOperations: UpdatePartstatOperation[] = [];
        if (isDeclineInvitation || isCancelInvitation) {
            const { inviteActions: cleanInviteActions, timestamp } = await sendIcs({
                inviteActions,
                vevent: originalVeventComponent,
                cancelVevent: originalVeventComponent,
            });
            updatedInviteActions = cleanInviteActions;
            if (isDeclineInvitation && originalVeventComponent) {
                // even though we are going to delete the event, we need to update the partstat first to notify the organizer for
                // Proton-Proton invites. Hopefully a better API will allow us to do it differently in the future
                const updatePartstatOperation = getUpdatePartstatOperation({
                    eventComponent: originalVeventComponent,
                    event: originalEvent,
                    memberID: originalMemberID,
                    timestamp,
                    inviteActions: updatedInviteActions,
                });
                if (updatePartstatOperation) {
                    updatePartstatOperations.push(updatePartstatOperation);
                }
            }
        }
        // For invitations we do not delete single edits (unless explicitly told so), but reset partstat if necessary
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        const eventsToDelete =
            isInvitation && !deleteSingleEdits
                ? [originalEvent].concat(singleEditRecurrences.filter((event) => getIsEventCancelled(event)))
                : recurrences;
        const deleteOperations = eventsToDelete.map(getDeleteSyncOperation);
        const resetPartstatOperations: UpdatePartstatOperation[] = [];
        const dropPersonalPartOperations: UpdatePersonalPartOperation[] = [];
        if (selfAttendeeToken) {
            const { updatePartstatActions, updatePersonalPartActions } = getResetPartstatActions(
                singleEditRecurrences,
                selfAttendeeToken,
                ICAL_ATTENDEE_STATUS.DECLINED
            );
            resetPartstatOperations.push(
                ...updatePartstatActions.map(({ calendarID, eventID, updateTime, attendeeID }) => {
                    return {
                        data: {
                            calendarID,
                            eventID,
                            updateTime,
                            attendeeID,
                            partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                        },
                    };
                })
            );
            if (!deleteSingleEdits) {
                dropPersonalPartOperations.push(
                    ...updatePersonalPartActions.map(({ calendarID, eventID }) => {
                        return { data: { memberID: originalMemberID, calendarID, eventID } };
                    })
                );
            }
        }

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
            updatePartstatActions: [...updatePartstatOperations, ...resetPartstatOperations],
            updatePersonalPartActions: dropPersonalPartOperations,
        };
    }

    throw new Error('Unknown delete type');
};
