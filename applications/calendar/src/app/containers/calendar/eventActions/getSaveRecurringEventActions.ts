import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getUpdatedInviteVevent } from 'proton-shared/lib/calendar/integration/invite';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { RECURRING_TYPES } from '../../../constants';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import { INVITE_ACTION_TYPES, InviteActions, SendIcsActionData } from '../../../interfaces/Invite';
import {
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import getUpdatePartstatOperation, { UpdatePartstatOperation } from '../getUpdatePartstatOperation';
import createFutureRecurrence from '../recurrence/createFutureRecurrence';
import createSingleRecurrence from '../recurrence/createSingleRecurrence';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import updateAllRecurrence from '../recurrence/updateAllRecurrence';
import updateSingleRecurrence from '../recurrence/updateSingleRecurrence';
import { UpdateAllPossibilities } from './getRecurringUpdateAllPossibilities';
import { getCurrentEvent, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { withIncreasedSequence, withVeventSequence } from './sequence';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
    isInvitation: boolean;
    inviteActions: InviteActions;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
    selfAttendeeToken?: string;
}

const getSaveRecurringEventActions = async ({
    type,
    recurrences,
    oldEditEventData: { eventData: oldEvent, veventComponent: oldVeventComponent },
    originalEditEventData: {
        eventData: originalEvent,
        calendarID: originalCalendarID,
        addressID: originalAddressID,
        memberID: originalMemberID,
        veventComponent: originalVeventComponent,
    },
    newEditEventData: {
        calendarID: newCalendarID,
        addressID: newAddressID,
        memberID: newMemberID,
        veventComponent: newVeventComponent,
    },
    recurrence,
    updateAllPossibilities,
    inviteActions,
    isInvitation,
    sendIcs,
    selfAttendeeToken,
}: SaveRecurringArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
}> => {
    const { type: inviteType, partstat: invitePartstat, resetSingleEditsPartstat } = inviteActions;
    const isSingleEdit = oldEvent.ID !== originalEvent.ID;

    if (!originalVeventComponent) {
        throw new Error('Original component missing');
    }
    if (!oldVeventComponent) {
        throw Error('Old component missing');
    }

    if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
        if (!invitePartstat) {
            throw new Error('Cannot update participation status without new answer');
        }
        await sendIcs({ inviteActions, vevent: newVeventComponent });
    }

    if (type === RECURRING_TYPES.SINGLE) {
        // we need to add the sequence to the old event as well, otherwise the API will complain
        const originalSequence = originalVeventComponent.sequence;
        const originalVeventWithSequence = {
            ...originalVeventComponent,
            sequence: { value: originalSequence ? originalSequence.value : 0 },
        };
        const maybeUpdateParentOperations = !originalSequence
            ? [getUpdateSyncOperation(originalVeventWithSequence, originalEvent)]
            : [];
        if (isSingleEdit) {
            // the sequence of the child must not be smaller than that of the parent
            // we could see such scenarios on production in chains where the parent was updated, but not all of its children
            const safeOldSequenceValue = Math.max(
                originalVeventWithSequence.sequence.value,
                oldVeventComponent?.sequence?.value || 0
            );
            const oldVeventWithSafeSequence = {
                ...oldVeventComponent,
                sequence: { value: safeOldSequenceValue },
            };
            const oldVeventWithSequence = oldVeventComponent.sequence
                ? oldVeventWithSafeSequence
                : withVeventSequence(oldVeventComponent, getCurrentEvent(originalVeventWithSequence, recurrence));
            const newVeventWithSequence = withVeventSequence(newVeventComponent, oldVeventWithSequence);
            const updateOperation = getUpdateSyncOperation(updateSingleRecurrence(newVeventWithSequence), oldEvent);

            return {
                multiSyncActions: [
                    {
                        calendarID: originalCalendarID,
                        addressID: originalAddressID,
                        memberID: originalMemberID,
                        operations: [...maybeUpdateParentOperations, updateOperation],
                    },
                ],
                inviteActions,
            };
        }

        const oldRecurrenceVeventComponent = getCurrentEvent(originalVeventWithSequence, recurrence);
        const newRecurrenceVeventComponent = createSingleRecurrence(
            newVeventComponent,
            originalVeventComponent,
            recurrence.localStart
        );
        const createOperation = getCreateSyncOperation(
            withVeventSequence(newRecurrenceVeventComponent, oldRecurrenceVeventComponent)
        );

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...maybeUpdateParentOperations, createOperation],
                },
            ],
            inviteActions,
        };
    }

    if (type === RECURRING_TYPES.FUTURE) {
        const newVeventWithSequence = {
            ...newVeventComponent,
            sequence: { value: 0 },
        };
        const originalVeventWithSequence = withIncreasedSequence(originalVeventComponent);
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        // These occurrences have to be deleted, even if the time was not changed, because a new chain with a new UID is created
        // So potentially instead of deleting, we could update all the events to be linked to the new UID but this is easier
        const deleteOperations = singleEditRecurrencesAfter.map(getDeleteSyncOperation);
        const updateOperation = getUpdateSyncOperation(
            deleteFutureRecurrence(originalVeventWithSequence, recurrence.localStart, recurrence.occurrenceNumber),
            originalEvent
        );
        const createOperation = getCreateSyncOperation(
            createFutureRecurrence(newVeventWithSequence, originalVeventWithSequence, recurrence)
        );

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...deleteOperations, updateOperation, createOperation],
                },
            ],
            inviteActions,
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        // For an invitation, we do not want to delete single edits as we want to keep in sync with the organizer's event
        const deleteOperations = isInvitation ? [] : singleEditRecurrences.map(getDeleteSyncOperation);
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

        const newRecurrentVevent = updateAllRecurrence({
            component: newVeventComponent,
            originalComponent: originalVeventComponent,
            mode: updateAllPossibilities,
            isSingleEdit,
            isInvitation,
        });
        const newRecurrentVeventWithSequence = withVeventSequence(newRecurrentVevent, originalVeventComponent);
        const isSendInviteType = [INVITE_ACTION_TYPES.SEND_INVITATION, INVITE_ACTION_TYPES.SEND_UPDATE].includes(
            inviteActions.type
        );

        const method = isSendInviteType ? ICAL_METHOD.REQUEST : undefined;
        let updatedVeventComponent = getUpdatedInviteVevent(
            newRecurrentVeventWithSequence,
            originalVeventComponent,
            method
        );
        let updatedInviteActions = inviteActions;
        if (isSendInviteType) {
            const { veventComponent: cleanVeventComponent, inviteActions: cleanInviteActions } = await sendIcs({
                inviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: originalVeventComponent,
            });
            if (cleanVeventComponent) {
                updatedVeventComponent = cleanVeventComponent;
                updatedInviteActions = cleanInviteActions;
            }
        }

        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, originalEvent);

        if (originalCalendarID !== newCalendarID) {
            const deleteOriginalOperation = getDeleteSyncOperation(originalEvent);
            return {
                multiSyncActions: [
                    {
                        calendarID: newCalendarID,
                        addressID: newAddressID,
                        memberID: newMemberID,
                        operations: [updateOperation],
                    },
                    {
                        calendarID: originalCalendarID,
                        addressID: originalAddressID,
                        memberID: originalMemberID,
                        operations: [...deleteOperations, deleteOriginalOperation],
                    },
                ],
                inviteActions: updatedInviteActions,
            };
        }

        return {
            multiSyncActions: [
                {
                    calendarID: newCalendarID,
                    addressID: newAddressID,
                    memberID: newMemberID,
                    operations: isInvitation ? [updateOperation] : [...deleteOperations, updateOperation],
                },
            ],
            updatePartstatActions: resetPartstatOperations,
            inviteActions: updatedInviteActions,
        };
    }

    throw new Error('Unknown type');
};

export default getSaveRecurringEventActions;
