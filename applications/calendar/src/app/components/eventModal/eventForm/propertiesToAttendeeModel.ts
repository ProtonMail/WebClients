import { ICAL_ATTENDEE_RSVP } from 'proton-shared/lib/calendar/constants';
import { extractEmailAddress } from 'proton-shared/lib/calendar/vcalConverter';
import { getAttendeePartstat, getAttendeeRole } from 'proton-shared/lib/calendar/vcalHelper';
import { VcalAttendeeProperty } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { AttendeeModel } from '../../../interfaces/EventModel';

export const propertiesToAttendeeModel = (attendee?: VcalAttendeeProperty[]): AttendeeModel[] => {
    if (!attendee) {
        return [];
    }
    return attendee.map((attendee) => {
        const { cn = '', role = '', partstat = '' } = attendee?.parameters || {};
        const email = extractEmailAddress(attendee);
        if (email === undefined) {
            throw new Error('Malformed attendee');
        }
        const result: AttendeeModel = {
            email,
            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
            cn,
            partstat: getAttendeePartstat(partstat),
            role: getAttendeeRole(role),
            token: attendee?.parameters?.['x-pm-token'],
        };
        return result;
    });
};
