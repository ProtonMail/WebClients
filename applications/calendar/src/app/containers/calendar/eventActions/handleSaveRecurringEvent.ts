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
import { getHasFutureOption } from './recurringHelper';
import getUpdateAllPossibilities from './getUpdateAllPossibilities';
import { OnSaveConfirmationCb } from '../interface';

interface Arguments {
    originalEventData: EventOldData;
    oldEventData: EventOldData;
    newEventData: EventNewData;

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
    originalEventData,
    newEventData,
    oldEventData,

    canOnlySaveAll,
    onSaveConfirmation,

    recurrence,
    recurrences,
    api,
    call,
    createNotification,
    getAddressKeys,
    getCalendarKeys,
    calendars
}: Arguments) => {
    const isFutureAllowed = getHasFutureOption(originalEventData.mainVeventComponent, recurrence);
    const updateAllPossibilities = getUpdateAllPossibilities(
        originalEventData.mainVeventComponent,
        oldEventData.mainVeventComponent,
        newEventData.veventComponent,
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

    const saveType = await onSaveConfirmation({
        type: SAVE_CONFIRMATION_TYPES.RECURRING,
        data: saveTypes
    });

    if (saveType === RECURRING_TYPES.ALL || saveType === RECURRING_TYPES.FUTURE) {
        await onSaveConfirmation({
            type: SAVE_CONFIRMATION_TYPES.RECURRING_MATCH_WARNING
        });
    }

    const multiActions = await getSaveRecurringEventActions({
        type: saveType,
        recurrences,
        originalEventData,
        oldEventData,
        newEventData,
        recurrence,
        updateAllPossibilities
    });

    await Promise.all(
        multiActions.map(async (sync) => {
            const payload = await getSyncMultipleEventsPayload({
                getAddressKeys,
                getCalendarKeys,
                sync
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
