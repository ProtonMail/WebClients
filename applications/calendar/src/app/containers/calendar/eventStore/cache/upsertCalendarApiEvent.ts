import { CalendarEventWithMetadata } from '@proton/shared/lib/interfaces/calendar';
import { pick } from '@proton/shared/lib/helpers/object';
import { postMessageFromIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';
import { APPS } from '@proton/shared/lib/constants';
import { CalendarEventsCache } from '../interface';
import getComponentFromCalendarEvent from './getComponentFromCalendarEvent';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';
import { OpenedMailEvent } from '../../../../hooks/useGetOpenedMailEvents';

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
    'AddressKeyPacket',
    'AddressID',
    'SharedEvents',
    'PersonalEvents',
    'AttendeesEvents',
    'Attendees',
] as const;

const upsertCalendarApiEvent = (
    Event: CalendarEventWithMetadata,
    calendarEventsCache: CalendarEventsCache,
    getOpenedMailEvents?: () => OpenedMailEvent[]
) => {
    const { ID: eventID, UID, ModifyTime } = Event;
    try {
        const eventComponent = getComponentFromCalendarEvent(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);
        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);
        const didUpsert = upsertCalendarEventStoreRecord(eventID, newCalendarEventStoreRecord, calendarEventsCache);
        // If the upserted event is open in Mail, tell it to refresh the widget
        const isOpenInMail = !!(getOpenedMailEvents?.() || []).find(({ UID: uid }) => UID === uid);
        if (didUpsert && isOpenInMail) {
            postMessageFromIframe(
                {
                    type: SIDE_APP_EVENTS.SIDE_APP_REFRESH_WIDGET,
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
