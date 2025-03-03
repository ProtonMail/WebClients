import { ICAL_ATTENDEE_RSVP } from '@proton/shared/lib/calendar/constants';
import { extractEmailAddress } from '@proton/shared/lib/calendar/vcalConverter';
import { getAttendeePartstat, getAttendeeRole } from '@proton/shared/lib/calendar/vcalHelper';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import type { VcalAttendeeProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { getIsCalendarEvent } from '../../../containers/calendar/eventStore/cache/helper';
import type { CalendarViewEventData } from '../../../containers/calendar/interface';

export const propertiesToAttendeeModel = (
    attendee?: VcalAttendeeProperty[],
    eventData?: CalendarViewEventData['eventData']
): AttendeeModel[] => {
    if (!attendee) {
        return [];
    }

    const attendees = eventData && getIsCalendarEvent(eventData) ? eventData.AttendeesInfo.Attendees : [];

    return attendee
        .map<AttendeeModel | null>((attendee) => {
            const email = extractEmailAddress(attendee);
            if (email === undefined) {
                captureMessage('Malformed attendee', { extra: { attendee } });
                return null;
            }

            // TODO handle comment decryption case there ?
            const comment = attendees.find(
                (attendeeEventData) => attendeeEventData.Token === attendee.parameters?.['x-pm-token']
            )?.Comment?.Message;

            const result: AttendeeModel = {
                email,
                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                cn: attendee.parameters?.cn || email,
                partstat: getAttendeePartstat(attendee),
                role: getAttendeeRole(attendee),
                token: attendee?.parameters?.['x-pm-token'],
                comment,
            };
            return result;
        })
        .filter<AttendeeModel>((attendee) => attendee !== null);
};
