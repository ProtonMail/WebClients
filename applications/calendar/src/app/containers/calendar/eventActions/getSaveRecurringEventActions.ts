import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { RECURRING_TYPES } from '../../../constants';
import createSingleRecurrence from '../recurrence/createSingleRecurrence';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import createFutureRecurrence from '../recurrence/createFutureRecurrence';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { SyncOperationTypes } from '../getSyncMultipleEventsPayload';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import updateSingleRecurrence from '../recurrence/updateSingleRecurrence';
import updateAllRecurrence from '../recurrence/updateAllRecurrence';
import { UpdateAllPossibilities } from './getUpdateAllPossibilities';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEventData: EventOldData;
    oldEventData: EventOldData;
    newEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
}

const getSaveRecurringEventActions = ({
    type,
    recurrences,
    oldEventData: { Event: oldEvent },
    originalEventData: {
        Event: originalEvent,
        calendarID: originalCalendarID,
        addressID: originalAddressID,
        memberID: originalMemberID,
        veventComponent: originalVeventComponent
    },
    newEventData: {
        calendarID: newCalendarID,
        addressID: newAddressID,
        memberID: newMemberID,
        veventComponent: newVeventComponent
    },
    recurrence,
    updateAllPossibilities
}: SaveRecurringArguments) => {
    const isSingleEdit = oldEvent.ID !== originalEvent.ID;

    if (type === RECURRING_TYPES.SINGLE) {
        if (isSingleEdit) {
            const updateOperation = {
                type: SyncOperationTypes.UPDATE,
                data: {
                    Event: oldEvent,
                    veventComponent: updateSingleRecurrence(newVeventComponent)
                }
            };
            return [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [updateOperation]
                }
            ];
        }

        const createOperation = {
            type: SyncOperationTypes.CREATE,
            data: {
                Event: undefined,
                veventComponent: createSingleRecurrence(
                    newVeventComponent,
                    originalVeventComponent,
                    recurrence.localStart
                )
            }
        };

        return [
            {
                calendarID: originalCalendarID,
                addressID: originalAddressID,
                memberID: originalMemberID,
                operations: [createOperation]
            }
        ];
    }

    if (type === RECURRING_TYPES.FUTURE) {
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        // These occurrences have to be deleted, even if the time was not changed, because a new chain with a new UID is created
        // So potentially instead of deleting, we could update all the events to be linked to the new UID but this is easier
        const deleteOperations = singleEditRecurrencesAfter.map((Event) => ({
            type: SyncOperationTypes.DELETE,
            data: {
                Event
            }
        }));

        const updatedOriginalVeventComponent = deleteFutureRecurrence(
            originalVeventComponent,
            recurrence.localStart,
            recurrence.occurrenceNumber
        );
        const updateOperation = {
            type: SyncOperationTypes.UPDATE,
            data: {
                Event: originalEvent,
                veventComponent: updatedOriginalVeventComponent
            }
        };

        const createOperation = {
            type: SyncOperationTypes.CREATE,
            data: {
                Event: undefined,
                veventComponent: createFutureRecurrence(
                    newVeventComponent,
                    originalVeventComponent,
                    recurrence,
                    isSingleEdit
                )
            }
        };

        return [
            {
                calendarID: originalCalendarID,
                addressID: originalAddressID,
                memberID: originalMemberID,
                operations: [...deleteOperations, updateOperation, createOperation]
            }
        ];
    }

    if (type === RECURRING_TYPES.ALL) {
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        const deleteOperations = singleEditRecurrences.map((Event) => ({
            type: SyncOperationTypes.DELETE,
            data: {
                Event
            }
        }));

        const updateOperation = {
            type: SyncOperationTypes.UPDATE,
            data: {
                Event: originalEvent,
                veventComponent: updateAllRecurrence({
                    component: newVeventComponent,
                    originalComponent: originalVeventComponent,
                    recurrence,
                    mode: updateAllPossibilities,
                    isSingleEdit
                })
            }
        };

        // First delete from the old calendar, then add to the new...
        if (originalCalendarID !== newCalendarID) {
            return [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: deleteOperations
                },
                {
                    calendarID: newCalendarID,
                    addressID: newAddressID,
                    memberID: newMemberID,
                    operations: [updateOperation]
                }
            ];
        }

        return [
            {
                calendarID: newCalendarID,
                addressID: newAddressID,
                memberID: newMemberID,
                operations: [...deleteOperations, updateOperation]
            }
        ];
    }

    throw new Error('Unknown type');
};

export default getSaveRecurringEventActions;
