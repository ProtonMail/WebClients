import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { RECURRING_TYPES, SAVE_CONFIRMATION_TYPES } from '../../../constants';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import { getExdatesAfter, getHasFutureOption, getRecurrenceEventsAfter } from './recurringHelper';
import { OnSaveConfirmationCb } from '../interface';

interface Arguments {
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    canOnlySaveAll: boolean;
    onSaveConfirmation: OnSaveConfirmationCb;

    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
}

const getRecurringSaveType = async ({
    originalEditEventData,
    oldEditEventData,
    canOnlySaveAll,
    onSaveConfirmation,
    recurrences,
    recurrence,
}: Arguments) => {
    const isFutureAllowed = getHasFutureOption(originalEditEventData.mainVeventComponent, recurrence);
    let saveTypes;

    if (canOnlySaveAll) {
        saveTypes = [RECURRING_TYPES.ALL];
    } else if (isFutureAllowed) {
        saveTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.FUTURE, RECURRING_TYPES.ALL];
    } else {
        saveTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
    }

    const singleEditRecurrences = recurrences.filter((event) => {
        // Not the single edit instance event, and not the original event
        return event.ID !== oldEditEventData.eventData.ID && event.ID !== originalEditEventData.eventData.ID;
    });
    const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);
    const exdates = originalEditEventData.mainVeventComponent.exdate || [];
    const exdatesAfter = getExdatesAfter(exdates, recurrence.localStart);

    return onSaveConfirmation({
        type: SAVE_CONFIRMATION_TYPES.RECURRING,
        data: {
            types: saveTypes,
            hasSingleModifications: singleEditRecurrences.length >= 1 || exdates.length >= 1,
            hasSingleModificationsAfter: singleEditRecurrencesAfter.length >= 1 || exdatesAfter.length >= 1,
        },
    });
};

export default getRecurringSaveType;
