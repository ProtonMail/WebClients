import { getUnixTime } from 'date-fns';
import { serverTime } from 'pmcrypto';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';

export interface UpdatePartstatOperation {
    data: {
        calendarID: string;
        eventID: string;
        attendeeID: string;
        partstat: ICAL_ATTENDEE_STATUS;
        updateTime: number;
    };
}

export interface UpdatePartstatArguments {
    event: CalendarEvent;
    attendeeID?: string;
    token?: string;
    partstat: ICAL_ATTENDEE_STATUS;
}

const getUpdatePartstatOperation = ({
    event,
    attendeeID,
    token,
    partstat,
}: UpdatePartstatArguments): UpdatePartstatOperation => {
    const { ID, CalendarID, Attendees } = event;
    const updateTime = getUnixTime(serverTime());
    if (attendeeID) {
        return {
            data: {
                calendarID: CalendarID,
                eventID: ID,
                attendeeID,
                partstat,
                updateTime,
            },
        };
    }
    const attendee = Attendees.find(({ Token }) => Token === token);
    if (!attendee) {
        throw new Error('Could not find attendee for updating participation status');
    }
    return {
        data: {
            calendarID: CalendarID,
            eventID: ID,
            attendeeID: attendee.ID,
            partstat,
            updateTime,
        },
    };
};

export default getUpdatePartstatOperation;
