import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { pick } from 'proton-shared/lib/helpers/object';
import { CalendarEventCache } from '../interface';
import getComponentFromCalendarEvent from './getComponentFromCalendarEvent';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';
import { getIsCalendarEvent } from './helper';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const FIELDS_TO_KEEP = [
    'ID',
    'SharedEventID',
    'CalendarID',
    'CreateTime',
    'LastEditTime',
    'Author',
    'Permissions',

    'CalendarKeyPacket',
    'CalendarEvents',
    'SharedKeyPacket',
    'SharedEvents',
    'PersonalEvent',
    'AttendeesEvent',
    'Attendees',
] as const;

const upsertCalendarApiEvent = (Event: CalendarEvent, calendarEventCache: CalendarEventCache) => {
    const oldEventRecord = calendarEventCache.events.get(Event.ID);

    try {
        const eventComponent = getComponentFromCalendarEvent(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);

        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);

        const oldEventData = oldEventRecord?.eventData;
        const isOldEventDataFull = oldEventData && getIsCalendarEvent(oldEventData);

        const oldLastEditTime = oldEventData?.LastEditTime || 0;
        const newLastEditTime = eventData.LastEditTime || 0;

        const isNewEventLastEditTime =
            newLastEditTime > oldLastEditTime || (newLastEditTime === oldLastEditTime && !isOldEventDataFull);

        const isNewEvent = !oldEventRecord || !oldEventData;
        const shouldUpsert = isNewEvent || isNewEventLastEditTime;

        if (!shouldUpsert) {
            return false;
        }

        upsertCalendarEventStoreRecord(eventData.ID, newCalendarEventStoreRecord, calendarEventCache);
        return true;
    } catch (error) {
        if (oldEventRecord) {
            removeCalendarEventStoreRecord(Event.ID, calendarEventCache);
        }
        return false;
    }
};

export default upsertCalendarApiEvent;
