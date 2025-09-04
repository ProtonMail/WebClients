import { APPS } from '@proton/shared/lib/constants';
import { postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import type { OpenedMailEvent } from '../../../../hooks/useGetOpenedMailEvents';
import type { CalendarEventsCache } from '../interface';
import getComponentFromCalendarEventUnencryptedPart from './getComponentFromCalendarEventUnencryptedPart';
import { removeCalendarEventStoreRecord } from './removeCalendarEventStoreRecord';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';

const upsertCalendarApiEvent = (
    Event: CalendarEvent,
    calendarEventsCache: CalendarEventsCache,
    getOpenedMailEvents?: () => OpenedMailEvent[]
) => {
    const { ID: eventID, UID, ModifyTime } = Event;
    try {
        const eventComponent = getComponentFromCalendarEventUnencryptedPart(Event);
        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, Event);
        const didUpsert = upsertCalendarEventStoreRecord(eventID, newCalendarEventStoreRecord, calendarEventsCache);
        // If the upserted event is open in Mail, tell it to refresh the widget
        const isOpenInMail = !!(getOpenedMailEvents?.() || []).find(({ UID: uid }) => UID === uid);
        if (didUpsert && isOpenInMail) {
            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.REFRESH_WIDGET,
                    payload: { UID, ModifyTime },
                },
                APPS.PROTONMAIL
            );
        }
        return didUpsert;
    } catch (error: any) {
        removeCalendarEventStoreRecord(eventID, calendarEventsCache);
        return false;
    }
};

export default upsertCalendarApiEvent;
