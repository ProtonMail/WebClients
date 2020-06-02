import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { EventModelReadView } from '../../interfaces/EventModel';
import getIsTemporaryViewEvent from '../../containers/calendar/getIsTemporaryViewEvent';
import { getDisplayTitle } from '../../helpers/event';

const getEventInformation = (calendarViewEvent: CalendarViewEvent, model: EventModelReadView) => {
    const { calendarData, eventReadResult } = calendarViewEvent.data;

    const isTemporaryEvent = getIsTemporaryViewEvent(calendarViewEvent);
    const tmpData = isTemporaryEvent ? (calendarViewEvent as CalendarViewEventTemporaryEvent).tmpData : undefined;

    const isEventReadLoading = !isTemporaryEvent && !eventReadResult;
    const eventReadError = eventReadResult?.error;

    const calendarColor = tmpData?.calendar.color || calendarData.Color;
    const eventTitleSafe = getDisplayTitle(tmpData?.title || model.title);

    return {
        isTemporaryEvent,
        isEventReadLoading,
        tmpData,
        calendarColor,
        eventReadError,
        eventTitleSafe,
    };
};

export default getEventInformation;
