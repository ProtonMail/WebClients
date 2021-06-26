import { getIsRecurring } from 'proton-shared/lib/calendar/vcalHelper';

import { CalendarEventsCache } from '../interface';
import { getRecurrenceIdDate, getUidValue } from '../../event/getEventHelper';
import { removeEventFromRecurrenceInstances, removeEventFromRecurringCache } from './recurringCache';

export const removeCalendarEventStoreRecord = (
    EventID: string,
    { tree, events, recurringEvents }: CalendarEventsCache
) => {
    const oldCalendarEventStoreRecord = events.get(EventID);
    if (!oldCalendarEventStoreRecord) {
        return;
    }
    const { utcStart, utcEnd, eventComponent } = oldCalendarEventStoreRecord;

    tree.remove(+utcStart, +utcEnd, EventID);

    const uid = getUidValue(eventComponent);
    const recurrenceId = getRecurrenceIdDate(eventComponent);
    const isRecurring = getIsRecurring(eventComponent);

    if (recurrenceId) {
        removeEventFromRecurrenceInstances(uid, +recurrenceId, recurringEvents, EventID);
    } else if (isRecurring) {
        removeEventFromRecurringCache(recurringEvents, uid, EventID);
    }

    events.delete(EventID);
};

export default removeCalendarEventStoreRecord;
