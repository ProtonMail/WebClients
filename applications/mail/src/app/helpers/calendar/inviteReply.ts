import { CreateCalendarEventSyncData, syncMultipleEvents } from 'proton-shared/lib/api/calendars';
import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { fromTriggerString, serialize } from 'proton-shared/lib/calendar/vcal';
import { dateTimeToProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsAlarmComponent, getIsAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import { API_CODES, HOUR } from 'proton-shared/lib/constants';
import { fromUTCDate } from 'proton-shared/lib/date/timezone';
import { Api } from 'proton-shared/lib/interfaces';
import {
    CalendarSettings,
    SETTINGS_NOTIFICATION_TYPE,
    SyncMultipleApiResponse
} from 'proton-shared/lib/interfaces/calendar';
import {
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import { EventInvitation, extractVevent, findAttendee, InvitationModel } from './invite';

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
export const createCalendarEventFromInvitation = async ({
    partstat,
    model,
    api
}: {
    partstat: ICAL_ATTENDEE_STATUS;
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    api: Api;
}) => {
    const {
        invitationIcs: { vevent, attendee },
        calendarData: { calendar, memberID, addressKeys, calendarKeys, calendarSettings } = {}
    } = model;
    if (!attendee?.addressID || !calendar || !memberID || !addressKeys || !calendarKeys || !calendarSettings) {
        throw new Error('Missing data for creating calendar event from invitation');
    }
    // save attendee answer
    const vcalAttendee = attendee.vcalComponent;
    const vcalAttendeeToSave = {
        ...vcalAttendee,
        parameters: {
            ...vcalAttendee.parameters,
            partstat
        }
    };
    // add alarms to event if necessary
    const veventToSave = partstat === ICAL_ATTENDEE_STATUS.DECLINED ? vevent : addAlarms(vevent, calendarSettings);
    const { index: attendeeIndex } = findAttendee(attendee.emailAddress, veventToSave.attendee);
    if (!veventToSave.attendee || attendeeIndex === undefined || attendeeIndex === -1) {
        throw new Error('Missing data for creating calendar event from invitation');
    }
    veventToSave.attendee[attendeeIndex] = vcalAttendeeToSave;
    const veventToSaveWithPmAttendees = await withPmAttendees(veventToSave, api);
    // create calendar event
    const data = await createCalendarEvent({
        eventComponent: veventToSaveWithPmAttendees,
        isSwitchCalendar: false,
        ...(await getCreationKeys({ addressKeys, newCalendarKeys: calendarKeys }))
    });
    const Events: CreateCalendarEventSyncData[] = [{ Overwrite: 1, Event: { Permissions: 3, ...data } }];
    const {
        Responses: [
            {
                Response: { Code, Event }
            }
        ]
    } = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendar.ID, { MemberID: memberID, Events, IsInvite: 1 }),
        timeout: HOUR,
        silence: true
    });
    if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
        throw new Error('Creating calendar event from invitation failed');
    }
    return {
        createdEvent: Event,
        savedVevent: veventToSave,
        savedVcalAttendee: vcalAttendeeToSave
    };
};
