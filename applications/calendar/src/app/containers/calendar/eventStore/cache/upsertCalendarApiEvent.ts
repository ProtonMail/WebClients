import { APPS } from '@proton/shared/lib/constants';
import { postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { pick } from '@proton/shared/lib/helpers/object';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import { OpenedMailEvent } from '../../../../hooks/useGetOpenedMailEvents';
import { CalendarEventsCache } from '../interface';
import getComponentFromCalendarEventUnencryptedPart from './getComponentFromCalendarEventUnencryptedPart';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';
import { getCalendarEventStoreRecord, upsertCalendarEventStoreRecord } from './upsertCalendarEventStoreRecord';

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
    Event: CalendarEvent,
    calendarEventsCache: CalendarEventsCache,
    getOpenedMailEvents?: () => OpenedMailEvent[]
) => {
    const { ID: eventID, UID, ModifyTime } = Event;
    try {
        const eventComponent = getComponentFromCalendarEventUnencryptedPart(Event);
        const eventData = pick(Event, FIELDS_TO_KEEP);
        const newCalendarEventStoreRecord = getCalendarEventStoreRecord(eventComponent, eventData);
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
