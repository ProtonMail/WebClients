import { getIsRecurring } from 'proton-shared/lib/calendar/vcalHelper';

import { CalendarEventCache } from '../interface';
import { getRecurrenceIdDate, getUid } from '../../event/getEventHelper';
import { removeEventFromRecurrenceInstances, removeEventFromRecurringCache } from './recurringCache';

export const removeCalendarEventStoreRecord = (
    EventID: string,
    { tree, events, recurringEvents }: CalendarEventCache
) => {
    const oldCalendarEventStoreRecord = events.get(EventID);
    if (!oldCalendarEventStoreRecord) {
        return;
    }
    const { utcStart, utcEnd, eventComponent } = oldCalendarEventStoreRecord;

    tree.remove(+utcStart, +utcEnd, EventID);

    const uid = getUid(eventComponent);
    const recurrenceId = getRecurrenceIdDate(eventComponent);
    const isRecurring = getIsRecurring(eventComponent);

    if (recurrenceId) {
        removeEventFromRecurrenceInstances(uid, +recurrenceId, recurringEvents);
    } else if (isRecurring) {
        removeEventFromRecurringCache(recurringEvents, uid);
    }

    events.delete(EventID);
};

export default removeCalendarEventStoreRecord;
