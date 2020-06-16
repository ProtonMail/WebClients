import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { RECURRING_TYPES } from '../../../constants';
import createSingleRecurrence from '../recurrence/createSingleRecurrence';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import createFutureRecurrence from '../recurrence/createFutureRecurrence';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import {
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import updateSingleRecurrence from '../recurrence/updateSingleRecurrence';
import updateAllRecurrence from '../recurrence/updateAllRecurrence';
import { UpdateAllPossibilities } from './getRecurringUpdateAllPossibilities';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
}

const getSaveRecurringEventActions = ({
    type,
    recurrences,
    oldEditEventData: { eventData: oldEvent },
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
}: SaveRecurringArguments): SyncEventActionOperations[] => {
    const isSingleEdit = oldEvent.ID !== originalEvent.ID;

    if (!originalVeventComponent) {
        throw new Error('Original component missing');
    }

    if (type === RECURRING_TYPES.SINGLE) {
        if (isSingleEdit) {
            const updateOperation = getUpdateSyncOperation(updateSingleRecurrence(newVeventComponent), oldEvent);
            return [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [updateOperation],
                },
            ];
        }

        const createOperation = getCreateSyncOperation(
            createSingleRecurrence(newVeventComponent, originalVeventComponent, recurrence.localStart)
        );

        return [
            {
                calendarID: originalCalendarID,
                addressID: originalAddressID,
                memberID: originalMemberID,
                operations: [createOperation],
            },
        ];
    }

    if (type === RECURRING_TYPES.FUTURE) {
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        // These occurrences have to be deleted, even if the time was not changed, because a new chain with a new UID is created
        // So potentially instead of deleting, we could update all the events to be linked to the new UID but this is easier
        const deleteOperations = singleEditRecurrencesAfter.map(getDeleteSyncOperation);
        const updateOperation = getUpdateSyncOperation(
            deleteFutureRecurrence(originalVeventComponent, recurrence.localStart, recurrence.occurrenceNumber),
            originalEvent
        );
        const createOperation = getCreateSyncOperation(
            createFutureRecurrence(newVeventComponent, originalVeventComponent, recurrence)
        );

        return [
            {
                calendarID: originalCalendarID,
                addressID: originalAddressID,
                memberID: originalMemberID,
                operations: [...deleteOperations, updateOperation, createOperation],
            },
        ];
    }

    if (type === RECURRING_TYPES.ALL) {
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        const deleteOperations = singleEditRecurrences.map(getDeleteSyncOperation);

        const updateOperation = getUpdateSyncOperation(
            updateAllRecurrence({
                component: newVeventComponent,
                originalComponent: originalVeventComponent,
                mode: updateAllPossibilities,
                isSingleEdit,
            }),
            originalEvent
        );

        if (originalCalendarID !== newCalendarID) {
            const deleteOriginalOperation = getDeleteSyncOperation(oldEvent);
            return [
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
            ];
        }

        return [
            {
                calendarID: newCalendarID,
                addressID: newAddressID,
                memberID: newMemberID,
                operations: [...deleteOperations, updateOperation],
            },
        ];
    }

    throw new Error('Unknown type');
};

export default getSaveRecurringEventActions;
