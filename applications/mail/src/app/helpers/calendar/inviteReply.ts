import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { serialize } from 'proton-shared/lib/calendar/vcal';
import { withDtstamp } from 'proton-shared/lib/calendar/veventHelper';
import {
    VcalDateOrDateTimeProperty,
    VcalNumberProperty,
    VcalUidProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { Participant } from './invite';

interface CreateReplyIcsParams {
    prodId: string;
    attendee: Participant;
    partstat: ICAL_ATTENDEE_STATUS;
    organizer: Participant;
    uid: VcalUidProperty;
    dtstart: VcalDateOrDateTimeProperty;
    dtend?: VcalDateOrDateTimeProperty;
    sequence?: VcalNumberProperty;
    'recurrence-id'?: VcalDateOrDateTimeProperty;
    vtimezone?: VcalVtimezoneComponent;
}
export const createReplyIcs = ({
    prodId,
    attendee,
    partstat,
    organizer,
    uid,
    dtstart,
    dtend,
    sequence,
    'recurrence-id': recurrenceId,
    vtimezone
}: CreateReplyIcsParams): string => {
    const attendeeIcs = attendee.vcalComponent;
    const organizerIcs = organizer.vcalComponent;
    // use current time as dtstamp
    const replyVevent = withDtstamp({
        component: 'vevent',
        uid,
        dtstart,
        organizer: organizerIcs,
        attendee: [
            {
                value: attendeeIcs.value,
                parameters: { partstat }
            }
        ]
    } as VcalVeventComponent);
    if (dtend) {
        replyVevent.dtend = dtend;
    }
    if (sequence) {
        replyVevent.sequence = sequence;
    }
    if (recurrenceId) {
        replyVevent['recurrence-id'] = recurrenceId;
    }
    const replyVcal: RequireSome<VcalVcalendar, 'components'> = {
        component: 'vcalendar',
        components: [replyVevent],
        prodid: { value: prodId },
        version: { value: '2.0' },
        method: { value: 'REPLY' },
        calscale: { value: 'GREGORIAN' }
    };
    if (vtimezone) {
        replyVcal.components.unshift(vtimezone);
    }
    return serialize(replyVcal);
};
