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
import { withIncreasedSequence, withVeventSequence } from './sequence';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
    hasModifiedRrule: boolean;
}

const getSaveRecurringEventActions = ({
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
    hasModifiedRrule,
}: SaveRecurringArguments): SyncEventActionOperations[] => {
    const isSingleEdit = oldEvent.ID !== originalEvent.ID;

    if (!originalVeventComponent) {
        throw new Error('Original component missing');
    }
    if (!oldVeventComponent) {
        throw Error('Old component missing');
    }

    if (type === RECURRING_TYPES.SINGLE) {
        if (isSingleEdit) {
            const newVeventWithSequence = withVeventSequence(newVeventComponent, oldVeventComponent, false);
            const updateOperation = getUpdateSyncOperation(updateSingleRecurrence(newVeventWithSequence), oldEvent);
            return [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [updateOperation],
                },
            ];
        }

        const newVeventWithSequence = withVeventSequence(newVeventComponent, oldVeventComponent, hasModifiedRrule);
        const createOperation = getCreateSyncOperation(
            createSingleRecurrence(newVeventWithSequence, originalVeventComponent, recurrence.localStart)
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

        const newRecurrentVevent = updateAllRecurrence({
            component: newVeventComponent,
            originalComponent: originalVeventComponent,
            mode: updateAllPossibilities,
            isSingleEdit,
        });
        const newRecurrentVeventWithSequence = withVeventSequence(
            newRecurrentVevent,
            originalVeventComponent,
            hasModifiedRrule
        );
        const updateOperation = getUpdateSyncOperation(newRecurrentVeventWithSequence, originalEvent);

        if (originalCalendarID !== newCalendarID) {
            const deleteOriginalOperation = getDeleteSyncOperation(originalEvent);
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
