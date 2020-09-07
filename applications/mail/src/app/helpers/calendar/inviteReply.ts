import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { fromTriggerString, serialize } from 'proton-shared/lib/calendar/vcal';
import { dateTimeToProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsAlarmComponent, getIsAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import { fromUTCDate } from 'proton-shared/lib/date/timezone';
import { CalendarSettings, SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import {
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { RequireSome } from '../../models/utils';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import { EventInvitation, extractVevent } from './invite';

export const addAlarms = (vevent: VcalVeventComponent, calendarSettings: CalendarSettings) => {
    const { components } = vevent;
    const isAllDay = getIsAllDay(vevent);
    const notifications = isAllDay
        ? calendarSettings.DefaultFullDayNotifications
        : calendarSettings.DefaultPartDayNotifications;
    const valarmComponents = notifications
        .filter(({ Type }) => Type === SETTINGS_NOTIFICATION_TYPE.DEVICE)
        .map<VcalValarmComponent>(({ Trigger }) => ({
            component: 'valarm',
            action: { value: 'DISPLAY' },
            trigger: { value: fromTriggerString(Trigger) }
        }));

    return {
        ...vevent,
        components: components ? components.concat(valarmComponents) : valarmComponents
    };
};

interface CreateReplyIcsParams {
    invitation: EventInvitation;
    prodId: string;
    partstat: ICAL_ATTENDEE_STATUS;
}
export const createReplyIcs = ({ invitation, prodId, partstat }: CreateReplyIcsParams): string => {
    const { originalVcalInvitation, vtimezone, attendee, organizer } = invitation;
    const originalVevent = extractVevent(originalVcalInvitation);
    if (!attendee?.addressID || !originalVevent || !organizer) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR);
    }
    const attendeeIcs = attendee.vcalComponent;
    const replyVevent = {
        ...(originalVevent as VcalVeventComponent),
        attendee: [
            {
                value: attendeeIcs.value,
                parameters: {
                    ...attendeeIcs.parameters,
                    partstat
                }
            }
        ],
        dtstamp: dateTimeToProperty(fromUTCDate(new Date()), true),
        components: originalVevent.components?.filter((c) => !getIsAlarmComponent(c))
    };
    const replyVcal: RequireSome<VcalVcalendar, 'components'> = {
        ...originalVcalInvitation,
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
