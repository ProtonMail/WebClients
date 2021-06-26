import { pick } from '@proton/shared/lib/helpers/object';
import { CalendarEventWithoutBlob } from '@proton/shared/lib/interfaces/calendar';
import { CalendarEventsCache } from '../interface';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';
import getComponentFromCalendarEventWithoutBlob from './getComponentFromCalendarEventWithoutBlob';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const FIELDS_TO_KEEP = [
    'ID',
    'Author',
    'SharedEventID',
    'CalendarID',
    'CreateTime',
    'ModifyTime',
    'Permissions',
    'IsOrganizer',
] as const;

const upsertCalendarApiEventWithoutBlob = (
    Event: CalendarEventWithoutBlob,
    calendarEventsCache: CalendarEventsCache
) => {
    const eventID = Event.ID;
    try {
        const eventComponent = getComponentFromCalendarEventWithoutBlob(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);
        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);
        return upsertCalendarEventStoreRecord(eventID, newCalendarEventStoreRecord, calendarEventsCache);
    } catch {
        removeCalendarEventStoreRecord(eventID, calendarEventsCache);
        return false;
    }
};

export default upsertCalendarApiEventWithoutBlob;
