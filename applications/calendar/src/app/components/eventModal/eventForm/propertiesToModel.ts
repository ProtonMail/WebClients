import { getDtendProperty, extractEmailAddress } from 'proton-shared/lib/calendar/vcalConverter';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ICAL_ATTENDEE_ROLE } from 'proton-shared/lib/calendar/constants';
import { AttendeeModel, EventModelView } from '../../../interfaces/EventModel';

import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import propertiesToDateTimeModel from './propertiesToDateTimeModel';

const DEFAULT_TIME = {
    value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    parameters: { tzid: 'UTC' },
};

export const propertiesToModel = (component: VcalVeventComponent, isAllDay: boolean, tzid: string): EventModelView => {
    const {
        uid,
        location,
        description,
        summary,
        dtstart = DEFAULT_TIME,
        rrule,
        attendee,
        organizer,
        ...rest
    } = component;

    const { start, end } = propertiesToDateTimeModel(dtstart, getDtendProperty(component), isAllDay, tzid);
    const organizerCn = organizer?.parameters?.cn;

    return {
        uid: uid ? uid.value : undefined,
        frequencyModel: propertiesToFrequencyModel(rrule, start),
        title: summary?.value ?? '',
        location: location?.value ?? '',
        description: description?.value ?? '',
        attendees: attendee
            ? attendee.map((attendee) => {
                  const { cn = '', rsvp, role } = attendee?.parameters || {};
                  const email = extractEmailAddress(attendee);
                  if (email === undefined) {
                      throw new Error('Malformed attendee');
                  }
                  return {
                      email,
                      rsvp: rsvp ? ('TRUE' as const) : ('FALSE' as const),
                      name: cn || '',
                      role: (role as ICAL_ATTENDEE_ROLE) || ICAL_ATTENDEE_ROLE.REQUIRED,
                      token: attendee?.parameters?.['x-pm-token'],
                  } as AttendeeModel;
              })
            : [],
        start,
        end,
        rest,
        ...(organizerCn && { organizer: organizerCn }),
    };
};
