import { useGetAddressKeys } from 'react-components';
import { Api } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { updateCalendar } from 'proton-shared/lib/api/calendars';
import { RECURRING_TYPES, SAVE_CONFIRMATION_TYPES } from '../../../constants';
import getSaveRecurringEventActions from './getSaveRecurringEventActions';
import getSyncMultipleEventsPayload from '../getSyncMultipleEventsPayload';
import { getRecurringEventUpdatedText } from '../../../components/eventModal/eventForm/i18n';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import { getExdatesAfter, getHasFutureOption, getRecurrenceEventsAfter } from './recurringHelper';
import getUpdateAllPossibilities from './getUpdateAllPossibilities';
import { OnSaveConfirmationCb } from '../interface';

interface Arguments {
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;

    canOnlySaveAll: boolean;
    onSaveConfirmation: OnSaveConfirmationCb;

    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    api: Api;
    call: () => Promise<void>;
    createNotification: (data: any) => void;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    calendars: Calendar[];
}

const handleSaveRecurringEvent = async ({
    originalEditEventData,
    newEditEventData,
    oldEditEventData,

    canOnlySaveAll,
    onSaveConfirmation,

    recurrence,
    recurrences,
    api,
    call,
    createNotification,
    getAddressKeys,
    getCalendarKeys,
    calendars,
}: Arguments) => {
    const isFutureAllowed = getHasFutureOption(originalEditEventData.mainVeventComponent, recurrence);
    const updateAllPossibilities = getUpdateAllPossibilities(
        originalEditEventData.mainVeventComponent,
        oldEditEventData.mainVeventComponent,
        newEditEventData.veventComponent,
        recurrence
    );

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

    const saveType = await onSaveConfirmation({
        type: SAVE_CONFIRMATION_TYPES.RECURRING,
        data: {
            types: saveTypes,
            hasSingleModifications: singleEditRecurrences.length >= 1 || exdates.length >= 1,
            hasSingleModificationsAfter: singleEditRecurrencesAfter.length >= 1 || exdatesAfter.length >= 1,
        },
    });

    const multiActions = await getSaveRecurringEventActions({
        type: saveType,
        recurrences,
        originalEditEventData,
        oldEditEventData,
        newEditEventData,
        recurrence,
        updateAllPossibilities,
    });

    await Promise.all(
        multiActions.map(async (sync) => {
            const payload = await getSyncMultipleEventsPayload({
                getAddressKeys,
                getCalendarKeys,
                sync,
            });
            return api(payload);
        })
    );

    const hiddenCalendars = multiActions.filter(({ calendarID }) => {
        const calendar = calendars.find(({ ID }) => ID === calendarID);
        return !calendar?.Display;
    });

    await Promise.all(
        hiddenCalendars.map(({ calendarID }) => {
            return api(updateCalendar(calendarID, { Display: 1 }));
        })
    );

    await call();

    createNotification({ text: getRecurringEventUpdatedText(saveType) });
};

export default handleSaveRecurringEvent;
