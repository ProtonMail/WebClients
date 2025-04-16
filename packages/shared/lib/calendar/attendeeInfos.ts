import { getPaginatedAttendeesInfo } from '@proton/shared/lib/api/calendars';
import { ATTENDEE_MORE_ATTENDEES } from '@proton/shared/lib/calendar/constants';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import type { Api } from '../interfaces';

/**
 * Fetch paginated attendees
 * @warning This method overwrites events AttendeesInfos
 * @param api - Method to perform API calls
 * @param Event - The event we overwrite with the attendees info.
 * @param page - The page number. Default to 1 as page 0 is already fetched with the getEvent call.
 */
export const fetchPaginatedAttendeesInfo = async (api: Api, Event: CalendarEvent, page = 1) => {
    const { Attendees, MoreAttendees } = await api<{
        Attendees: CalendarEvent['AttendeesInfo']['Attendees'];
        MoreAttendees: CalendarEvent['AttendeesInfo']['MoreAttendees'];
    }>({
        ...getPaginatedAttendeesInfo(Event.CalendarID, Event.ID, page),
        silence: true,
    });

    Event.AttendeesInfo.Attendees = Event.AttendeesInfo.Attendees.concat(Attendees);
    Event.AttendeesInfo.MoreAttendees = MoreAttendees;

    if (MoreAttendees === ATTENDEE_MORE_ATTENDEES.YES) {
        await fetchPaginatedAttendeesInfo(api, Event, page + 1);
    }
};
