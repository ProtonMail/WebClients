import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { pick } from '@proton/shared/lib/helpers/object';
import { CalendarEventsCache } from '../interface';
import getComponentFromCalendarEvent from './getComponentFromCalendarEvent';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const FIELDS_TO_KEEP = [
    'ID',
    'SharedEventID',
    'CalendarID',
    'CreateTime',
    'ModifyTime',
    'Author',
    'Permissions',
    'IsOrganizer',
    'IsProtonProtonInvite',

    'CalendarKeyPacket',
    'CalendarEvents',
    'SharedKeyPacket',
    'SharedEvents',
    'PersonalEvent',
    'AttendeesEvents',
    'Attendees',
] as const;

const upsertCalendarApiEvent = (Event: CalendarEvent, calendarEventsCache: CalendarEventsCache) => {
    const eventID = Event.ID;
    try {
        const eventComponent = getComponentFromCalendarEvent(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);
        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);
        return upsertCalendarEventStoreRecord(eventID, newCalendarEventStoreRecord, calendarEventsCache);
    } catch (error) {
        removeCalendarEventStoreRecord(eventID, calendarEventsCache);
        return false;
    }
};

export default upsertCalendarApiEvent;
