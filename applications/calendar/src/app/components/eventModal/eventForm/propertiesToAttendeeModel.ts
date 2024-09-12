import { ICAL_ATTENDEE_RSVP } from '@proton/shared/lib/calendar/constants';
import { extractEmailAddress } from '@proton/shared/lib/calendar/vcalConverter';
import { getAttendeePartstat, getAttendeeRole } from '@proton/shared/lib/calendar/vcalHelper';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import type { VcalAttendeeProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';

export const propertiesToAttendeeModel = (attendee?: VcalAttendeeProperty[]): AttendeeModel[] => {
    if (!attendee) {
        return [];
    }
    return attendee
        .map<AttendeeModel | null>((attendee) => {
            const email = extractEmailAddress(attendee);
            if (email === undefined) {
                captureMessage('Malformed attendee', { extra: { attendee } });
                return null;
            }
            const result: AttendeeModel = {
                email,
                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                cn: attendee.parameters?.cn || email,
                partstat: getAttendeePartstat(attendee),
                role: getAttendeeRole(attendee),
                token: attendee?.parameters?.['x-pm-token'],
            };
            return result;
        })
        .filter<AttendeeModel>((attendee) => attendee !== null);
};
