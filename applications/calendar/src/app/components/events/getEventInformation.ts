import { FREQUENCY, ICAL_EVENT_STATUS } from 'proton-shared/lib/calendar/constants';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import getIsTemporaryViewEvent from '../../containers/calendar/getIsTemporaryViewEvent';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { EventModelReadView } from '../../interfaces/EventModel';

const getEventInformation = (calendarViewEvent: CalendarViewEvent, model: EventModelReadView) => {
    const { calendarData, eventReadResult } = calendarViewEvent.data;

    const isTemporaryEvent = getIsTemporaryViewEvent(calendarViewEvent);
    const tmpData = isTemporaryEvent ? (calendarViewEvent as CalendarViewEventTemporaryEvent).tmpData : undefined;

    const isEventReadLoading = !isTemporaryEvent && !eventReadResult;
    const eventReadError = eventReadResult?.error;

    const calendarColor = tmpData?.calendar.color || calendarData.Color;
    const eventTitleSafe = getDisplayTitle(tmpData?.title || model.title);
    const isCancelled = model.status === ICAL_EVENT_STATUS.CANCELLED;
    const isRecurring = model.frequencyModel.type !== FREQUENCY.ONCE;
    const isSingleEdit = !!eventReadResult?.result?.[0]['recurrence-id'];

    return {
        isTemporaryEvent,
        isEventReadLoading,
        tmpData,
        calendarColor,
        eventReadError,
        eventTitleSafe,
        isCancelled,
        isRecurring,
        isSingleEdit,
    };
};

export default getEventInformation;
