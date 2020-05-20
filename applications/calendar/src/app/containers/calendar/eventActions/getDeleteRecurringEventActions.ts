import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import deleteSingleRecurrence from '../recurrence/deleteSingleRecurrence';
import { RECURRING_TYPES } from '../../../constants';
import { SyncMultipleEventsOperations, SyncOperationTypes } from '../getSyncMultipleEventsPayload';
import { getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';

interface DeleteRecurringArguments {
    type: RECURRING_TYPES;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    originalEventData: EventOldData;
    oldEventData: EventOldData;
}

export const getDeleteRecurringEventActions = ({
    type,
    recurrence,
    recurrences,
    originalEventData: {
        veventComponent: originalVeventComponent,
        Event: originalEvent,
        calendarID: originalCalendarID,
        addressID: originalAddressID,
        memberID: originalMemberID,
    },
    oldEventData: { Event: oldEvent },
}: DeleteRecurringArguments): SyncMultipleEventsOperations => {
    if (type === RECURRING_TYPES.SINGLE) {
        if (!originalVeventComponent) {
            throw new Error('Can not delete single occurrence without original event');
        }

        const isSingleEdit = oldEvent.ID !== originalEvent.ID;
        const updatedVeventComponent = deleteSingleRecurrence(originalVeventComponent, recurrence.localStart);

        const singleDeleteOperation = isSingleEdit
            ? {
                  type: SyncOperationTypes.DELETE,
                  data: {
                      Event: oldEvent,
                  },
              }
            : undefined;

        const originalExdateOperation = {
            type: SyncOperationTypes.UPDATE,
            data: {
                Event: originalEvent,
                veventComponent: updatedVeventComponent,
            },
        };

        return {
            calendarID: originalCalendarID,
            addressID: originalAddressID,
            memberID: originalMemberID,
            operations: [singleDeleteOperation, originalExdateOperation].filter(isTruthy),
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

        const deleteOperations = singleEditRecurrencesAfter.map((Event) => ({
            type: SyncOperationTypes.DELETE,
            data: {
                Event,
            },
        }));

        const updateOperation = {
            type: SyncOperationTypes.UPDATE,
            data: {
                Event: originalEvent,
                veventComponent: updatedVeventComponent,
            },
        };

        return {
            calendarID: originalCalendarID,
            addressID: originalAddressID,
            memberID: originalMemberID,
            operations: [...deleteOperations, updateOperation],
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        if (!recurrences.length) {
            throw new Error('Can not delete all events without any recurrences');
        }

        const deleteOperations = recurrences.map((Event) => ({
            type: SyncOperationTypes.DELETE,
            data: {
                Event,
            },
        }));

        return {
            calendarID: originalCalendarID,
            addressID: originalAddressID,
            memberID: originalMemberID,
            operations: deleteOperations,
        };
    }

    throw new Error('Unknown delete type');
};
