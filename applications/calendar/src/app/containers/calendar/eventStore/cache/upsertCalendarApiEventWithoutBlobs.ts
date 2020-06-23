import { pick } from 'proton-shared/lib/helpers/object';
import { CalendarEventWithoutBlob } from 'proton-shared/lib/interfaces/calendar';
import { CalendarEventCache } from '../interface';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';
import getComponentFromCalendarEventWithoutBlob from './getComponentFromCalendarEventWithoutBlob';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const FIELDS_TO_KEEP = ['ID', 'SharedEventID', 'CalendarID', 'CreateTime', 'ModifyTime', 'Permissions'] as const;

const upsertCalendarApiEventWithoutBlob = (Event: CalendarEventWithoutBlob, calendarEventCache: CalendarEventCache) => {
    const eventID = Event.ID;
    try {
        const eventComponent = getComponentFromCalendarEventWithoutBlob(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);
        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);
        return upsertCalendarEventStoreRecord(eventID, newCalendarEventStoreRecord, calendarEventCache);
    } catch {
        removeCalendarEventStoreRecord(eventID, calendarEventCache);
        return false;
    }
};

export default upsertCalendarApiEventWithoutBlob;
