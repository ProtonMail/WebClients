import { getDtendProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import propertiesToDateTimeModel from './propertiesToDateTimeModel';
import { EventModelView } from '../../../interfaces/EventModel';

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
        // attendee,
        ...rest
    } = component;

    const { start, end } = propertiesToDateTimeModel(dtstart, getDtendProperty(component), isAllDay, tzid);

    return {
        uid: uid ? uid.value : undefined,
        frequencyModel: propertiesToFrequencyModel(rrule, start),
        title: summary?.value ?? '',
        location: location?.value ?? '',
        description: description?.value ?? '',
        /*
        attendees: attendee
            ? attendee.map(
                  ({ value, parameters: { cn = '', rsvp = 'FALSE', ['x-pm-permissions']: permissions } = {} }) => ({
                      name: cn || '',
                      email: value,
                      permissions,
                      rsvp: rsvp !== 'FALSE'
                  })
              )
            : [],
         */
        start,
        end,
        rest,
    };
};
