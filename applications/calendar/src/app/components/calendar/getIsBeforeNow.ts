import { isSameDay } from '@proton/shared/lib/date-fns-utc';

import { CalendarViewBusyEvent, CalendarViewEvent } from '../../containers/calendar/interface';

const getIsBeforeNow = (event: CalendarViewEvent | CalendarViewBusyEvent, now: Date) => {
    const isPartDay = !event.isAllDay || event.isAllPartDay;
    const isBeforeNowExact = now > event.end;
    return isPartDay ? isBeforeNowExact : isBeforeNowExact && !isSameDay(now, event.end);
};

export default getIsBeforeNow;
