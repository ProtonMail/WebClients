import { CalendarViewEvent } from '../../../containers/calendar/interface';
import { LayoutEvent } from '../layout';

export const getEvent = (idx: number, eventsInRow: LayoutEvent[], events: CalendarViewEvent[]) => {
    const { idx: eventIdx } = eventsInRow[idx];
    return events[eventIdx];
};
