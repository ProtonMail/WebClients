import { buildMailTo } from '../helpers/email';
import { VcalValarmComponent } from '../interfaces/calendar';
import { ICAL_ALARM_ACTION } from './constants';
import { getSupportedAlarmAction } from './icsSurgery/valarm';

/**
 * Helper that takes a vAlarm as it's persisted in our database and returns one that is RFC-compatible for PUBLISH method
 *
 * A description field, as well as summary and attendee fields for email alarms, are mandatory on RFC-5545 (https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.6).
 * Although we don't store them internally, we need to add them when exporting to other providers. According to the RFC:
 */
export const withMandatoryPublishFields = (
    valarm: VcalValarmComponent,
    eventTitle: string,
    calendarEmail: string
): VcalValarmComponent => {
    if (getSupportedAlarmAction(valarm.action).value === ICAL_ALARM_ACTION.EMAIL) {
        return {
            summary: { value: eventTitle }, // <<contains the text to be used as the message subject>>
            description: { value: eventTitle }, // <<contains the text to be used as the message body>>
            attendee: [{ value: buildMailTo(calendarEmail) }], // <<contain the email address of attendees to receive the message>>
            ...valarm,
        };
    }

    return {
        description: { value: eventTitle }, // <<contains the text to be displayed when the alarm is triggered>>
        ...valarm,
    };
};
