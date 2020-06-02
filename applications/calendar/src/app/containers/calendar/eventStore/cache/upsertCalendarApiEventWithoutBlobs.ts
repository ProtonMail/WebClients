import { pick } from 'proton-shared/lib/helpers/object';
import { CalendarEventWithoutBlob } from 'proton-shared/lib/interfaces/calendar';
import { CalendarEventCache } from '../interface';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';
import getComponentFromCalendarEventWithoutBlob from './getComponentFromCalendarEventWithoutBlob';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const FIELDS_TO_KEEP: (keyof CalendarEventWithoutBlob)[] = [
    'ID',
    'CalendarID',
    'CreateTime',
    'LastEditTime',
    'Author',
    'Permissions',
];

const upsertCalendarApiEventWithoutBlob = (Event: CalendarEventWithoutBlob, calendarEventCache: CalendarEventCache) => {
    const oldEventRecord = calendarEventCache.events.get(Event.ID);
    try {
        const eventComponent = getComponentFromCalendarEventWithoutBlob(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);

        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);
        upsertCalendarEventStoreRecord(eventData.ID, newCalendarEventStoreRecord, calendarEventCache);

        return true;
    } catch {
        if (oldEventRecord) {
            removeCalendarEventStoreRecord(Event.ID, calendarEventCache);
        }
        return false;
    }
};

export default upsertCalendarApiEventWithoutBlob;
