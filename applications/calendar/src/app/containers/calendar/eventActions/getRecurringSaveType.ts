import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { RECURRING_TYPES, SAVE_CONFIRMATION_TYPES } from '../../../constants';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import { getExdatesAfter, getHasFutureOption, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { OnSaveConfirmationCb } from '../interface';

interface Arguments {
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    canOnlySaveAll: boolean;
    onSaveConfirmation: OnSaveConfirmationCb;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    hasModifiedRrule: boolean;
}

const getRecurringSaveType = async ({
    originalEditEventData,
    oldEditEventData,
    canOnlySaveAll,
    onSaveConfirmation,
    recurrences,
    recurrence,
    hasModifiedRrule,
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

    const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEditEventData.eventData);
    const singleEditRecurrencesWithoutSelf = singleEditRecurrences.filter((event) => {
        return event.ID !== oldEditEventData.eventData.ID;
    });
    // Since this is inclusive, ignore this single edit instance event since that would always become the new start
    const singleEditRecurrencesAfter = getRecurrenceEventsAfter(
        singleEditRecurrencesWithoutSelf,
        recurrence.localStart
    );
    const exdates = originalEditEventData.mainVeventComponent.exdate || [];
    const exdatesAfter = getExdatesAfter(exdates, recurrence.localStart);

    const hasSingleModifications = singleEditRecurrences.length >= 1 || exdates.length >= 1;
    const hasSingleModificationsAfter = singleEditRecurrencesAfter.length >= 1 || exdatesAfter.length >= 1;

    return onSaveConfirmation({
        type: SAVE_CONFIRMATION_TYPES.RECURRING,
        data: {
            types: saveTypes,
            hasSingleModifications,
            hasSingleModificationsAfter,
            hasRruleModification: hasModifiedRrule,
        },
    });
};

export default getRecurringSaveType;
