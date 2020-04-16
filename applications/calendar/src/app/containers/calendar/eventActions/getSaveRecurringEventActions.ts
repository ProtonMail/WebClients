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

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEventData: EventOldData;
    oldEventData: EventOldData;
    newEventData: EventNewData;
    recurrence: CalendarEventRecurring;
}

const getSaveRecurringEventActions = ({
    type,
    recurrences,
    oldEventData: { Event: oldEvent, veventComponent: oldVeventComponent },
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
    recurrence
}: SaveRecurringArguments) => {
    const isSingleEdit = oldEvent.ID !== originalEvent.ID;

    if (!oldVeventComponent) {
        throw new Error('Can not update without the old event');
    }

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

        if (!originalVeventComponent) {
            throw new Error('Can not update single occurrence without the original event');
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
        if (!originalVeventComponent) {
            throw new Error('Can not update future recurrences without the original event');
        }

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
        if (!originalVeventComponent) {
            throw new Error('Can not update all recurrences without the original event');
        }

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
                veventComponent: updateAllRecurrence(
                    newVeventComponent,
                    originalVeventComponent,
                    recurrence,
                    isSingleEdit
                )
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
