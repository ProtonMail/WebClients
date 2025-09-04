import { pick } from '@proton/shared/lib/helpers/object';
import type { CalendarEventWithoutBlob } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarEventsCache } from '../interface';
import getComponentFromCalendarEventWithoutBlob from './getComponentFromCalendarEventWithoutBlob';
import { removeCalendarEventStoreRecord } from './removeCalendarEventStoreRecord';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';

const FIELDS_TO_KEEP = [
    'ID',
    'Author',
    'SharedEventID',
    'CalendarID',
    'CreateTime',
    'ModifyTime',
    'Permissions',
    'IsOrganizer',
    'IsProtonProtonInvite',
    'IsPersonalSingleEdit',
    'Color',
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
