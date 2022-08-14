import { getIsRecurring, getRecurrenceIdDate, getUidValue } from '@proton/shared/lib/calendar/vcalHelper';
import { APPS } from '@proton/shared/lib/constants';
import { postMessageFromIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';

import { OpenedMailEvent } from '../../../../hooks/useGetOpenedMailEvents';
import { CalendarEventsCache } from '../interface';
import { removeEventFromRecurrenceInstances, removeEventFromRecurringCache } from './recurringCache';

export const removeCalendarEventStoreRecord = (
    EventID: string,
    { tree, events, recurringEvents }: CalendarEventsCache,
    getOpenedMailEvents?: () => OpenedMailEvent[]
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

    // If the deleted event is open in Mail, tell it to refresh the widget
    if ((getOpenedMailEvents?.() || []).find(({ UID }) => UID === uid)) {
        postMessageFromIframe(
            {
                type: SIDE_APP_EVENTS.SIDE_APP_REFRESH_WIDGET,
                payload: { UID: uid, ModifyTime: Number.POSITIVE_INFINITY },
            },
            APPS.PROTONMAIL
        );
    }
};

export default removeCalendarEventStoreRecord;
