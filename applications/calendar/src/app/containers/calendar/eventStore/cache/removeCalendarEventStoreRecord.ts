import { isIcalRecurring } from 'proton-shared/lib/calendar/recurring';
import { CalendarEventCache } from '../interface';
import { getRecurrenceId, getUid } from '../../event/getEventHelper';
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
    const recurrenceId = getRecurrenceId(eventComponent);
    const isRecurring = isIcalRecurring(eventComponent);

    if (recurrenceId) {
        removeEventFromRecurrenceInstances(uid, +recurrenceId, recurringEvents);
    } else if (isRecurring) {
        removeEventFromRecurringCache(recurringEvents, uid);
    }

    events.delete(EventID);
};

export default removeCalendarEventStoreRecord;
