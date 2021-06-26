import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from './interface';

const getIsTemporaryViewEvent = (
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent
): event is CalendarViewEventTemporaryEvent => {
    return (event as CalendarViewEventTemporaryEvent).tmpData !== undefined;
};

export default getIsTemporaryViewEvent;
