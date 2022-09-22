import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getResetPartstatActions } from '@proton/shared/lib/calendar/integration/invite';
import { getIsEventCancelled, withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import unary from '@proton/utils/unary';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import {
    INVITE_ACTION_TYPES,
    InviteActions,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import {
    SyncEventActionOperations,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
} from '../getSyncMultipleEventsPayload';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import deleteSingleRecurrence from '../recurrence/deleteSingleRecurrence';
import { getUpdatePartstatOperation } from './getChangePartstatActions';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';

interface DeleteRecurringArguments {
    type: RECURRING_TYPES;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    isAttendee: boolean;
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
    isAttendee,
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

        const originalExdateOperation = getUpdateSyncOperation({
            veventComponent: withDtstamp(omit(updatedVeventComponent, ['dtstamp'])),
            calendarEvent: originalEvent,
            isAttendee,
        });

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

        const deleteOperations = singleEditRecurrencesAfter.map(unary(getDeleteSyncOperation));
        const updateOperation = getUpdateSyncOperation({
            veventComponent: withDtstamp(omit(updatedVeventComponent, ['dtstamp'])),
            calendarEvent: originalEvent,
            isAttendee,
        });

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
                    silence: true,
                });
                if (updatePartstatOperation) {
                    updatePartstatOperations.push(updatePartstatOperation);
                }
            }
        }
        // For invitations we do not delete single edits (unless explicitly told so), but reset partstat if necessary
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        const eventsToDelete =
            isAttendee && !deleteSingleEdits
                ? [originalEvent].concat(singleEditRecurrences.filter((event) => getIsEventCancelled(event)))
                : recurrences;
        const deleteOperations = eventsToDelete.map(unary(getDeleteSyncOperation));
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
                        silence: true,
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
