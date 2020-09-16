import { getUnixTime } from 'date-fns';
import {
    getEventByUID,
    GetEventByUIDArguments,
    syncMultipleEvents,
    UpdateCalendarEventSyncData
} from 'proton-shared/lib/api/calendars';
import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import { ICAL_EVENT_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { getAttendeeHasPartStat } from 'proton-shared/lib/calendar/vcalHelper';
import { API_CODES } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { omit } from 'proton-shared/lib/helpers/object';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { Calendar, CalendarEvent, SyncMultipleApiResponse } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { MessageExtended } from '../../models/message';
import { RequireSome, Unwrap } from '../../models/utils';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import {
    CalendarWidgetData,
    EventInvitation,
    getHasModifiedAttendees,
    InvitationModel,
    processEventInvitation
} from './invite';

type FetchEventInvitation = (args: {
    veventComponent: VcalVeventComponent;
    api: Api;
    getCalendarEventRaw: (event: CalendarEvent) => Promise<VcalVeventComponent>;
    calendars: Calendar[];
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}) => Promise<{
    invitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendar?: Calendar;
}>;
export const fetchEventInvitation: FetchEventInvitation = async ({
    veventComponent,
    api,
    getCalendarEventRaw,
    calendars,
    message,
    contactEmails,
    ownAddresses
}) => {
    const recurrenceID = veventComponent['recurrence-id'];
    const params: GetEventByUIDArguments[] = [{ UID: veventComponent.uid.value, Page: 0, PageSize: 1 }];
    if (recurrenceID) {
        // we want to retrieve the single edit plus the parent in this case
        const timestamp = getUnixTime(propertyToUTCDate(recurrenceID));
        params.unshift({ UID: veventComponent.uid.value, Page: 0, PageSize: 1, RecurrenceID: timestamp });
    }
    const response = await Promise.all(params.map((args) => api<{ Events: CalendarEvent[] }>(getEventByUID(args))));
    // keep only the first event the API found (typically the one from the default calendar)
    const calendarEvents = response.map(({ Events: [event] = [] }) => event).filter(isTruthy);
    const vevents = await Promise.all(calendarEvents.map((event) => getCalendarEventRaw(event)));
    if (!vevents.length) {
        return {};
    }
    const [calendarEvent, calendarParentEvent] = calendarEvents;
    const [vevent, parentVevent] = vevents;
    const { invitation } = processEventInvitation({ vevent }, message, contactEmails, ownAddresses);
    const result: Unwrap<ReturnType<FetchEventInvitation>> = {
        invitation: { ...invitation, calendarEvent },
        calendar: calendars.find(({ ID }) => ID === calendarEvent.CalendarID) || undefined
    };
    if (parentVevent) {
        const { invitation: parentInvitation } = processEventInvitation(
            { vevent: parentVevent },
            message,
            contactEmails,
            ownAddresses
        );
        result.parentInvitation = { ...parentInvitation, calendarEvent: calendarParentEvent };
    }
    return result;
};

interface UpdateEventArgs {
    calendarEvent: CalendarEvent;
    vevent: VcalVeventComponent;
    api: Api;
    calendarData: Required<CalendarWidgetData>;
}
const updateEventApi = async ({ calendarEvent, vevent, api, calendarData }: UpdateEventArgs) => {
    const {
        calendar: { ID: calendarID },
        memberID,
        addressKeys,
        calendarKeys
    } = calendarData;
    const veventWithPmAttendees = await withPmAttendees(vevent, api);
    const data = await createCalendarEvent({
        eventComponent: veventWithPmAttendees,
        isSwitchCalendar: false,
        ...(await getCreationKeys({ Event: calendarEvent, addressKeys, newCalendarKeys: calendarKeys }))
    });
    const Events: UpdateCalendarEventSyncData[] = [
        {
            ID: calendarEvent.ID,
            Event: { Permissions: 3, ...omit(data, ['SharedKeyPacket', 'CalendarKeyPacket']) }
        }
    ];
    const {
        Responses: [
            {
                Response: { Code }
            }
        ]
    } = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendarID, { MemberID: memberID, Events }),
        silence: true
    });
    if (Code !== API_CODES.SINGLE_SUCCESS) {
        throw new Error('Update unsuccessful');
    }
};

interface UpdateEventInvitationArgs
    extends Omit<RequireSome<InvitationModel, 'invitationIcs' | 'invitationApi'>, 'timeStatus'> {
    calendarData: Required<CalendarWidgetData>;
    api: Api;
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}

export const updateEventInvitation = async ({
    isOrganizerMode,
    calendarData,
    invitationIcs,
    invitationApi,
    parentInvitationApi,
    api,
    message,
    contactEmails,
    ownAddresses
}: UpdateEventInvitationArgs): Promise<undefined | RequireSome<EventInvitation, 'calendarEvent'>> => {
    const { method, vevent: veventIcs } = invitationIcs;
    const { calendarEvent, vevent: veventApi } = invitationApi;
    const attendeeIcs = invitationIcs.attendee?.vcalComponent;
    const attendeeApi = invitationApi.attendee?.vcalComponent;
    const recurrenceIdIcs = veventIcs['recurrence-id'];

    if (isOrganizerMode) {
        if (method === ICAL_METHOD.REPLY) {
            if (!veventApi) {
                if (!recurrenceIdIcs) {
                    return;
                }
                // TODO: create single edit
            }
            if (!attendeeIcs) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
            if (!attendeeApi) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
            if (!getAttendeeHasPartStat(attendeeIcs) || !getAttendeeHasPartStat(attendeeApi)) {
                throw new Error('Participation status of attendees required');
            }
            const partStatIcs = attendeeIcs.parameters.partstat;
            const partStatApi = attendeeApi.parameters.partstat;
            if (partStatApi !== partStatIcs) {
                // TODO: update eventApi with partstatIcs
            }
        }
    }
    if (method === ICAL_METHOD.REQUEST) {
        const sequenceApi = +(veventApi?.sequence?.value || 0);
        const sequenceIcs = +(veventIcs.sequence?.value || 0);
        const sequenceDiff = sequenceIcs - sequenceApi;
        if (!veventApi) {
            // TODO: check for SharedEventID and create new event accordingly
            return;
        }
        if (sequenceDiff < 0) {
            return;
        }
        const hasUpdatedTitle = veventIcs.summary?.value !== veventApi.summary?.value;
        const hasUpdatedDescription = veventIcs.description?.value !== veventApi.description?.value;
        const hasUpdatedLocation = veventIcs.location?.value !== veventApi.location?.value;
        const hasUpdatedAttendees = getHasModifiedAttendees(veventIcs.attendee, veventApi.attendee);
        const isUpdated =
            sequenceDiff > 0 || hasUpdatedTitle || hasUpdatedDescription || hasUpdatedLocation || hasUpdatedAttendees;
        if (isUpdated) {
            // update the api event by the ics one
            try {
                await updateEventApi({
                    calendarEvent,
                    vevent: veventIcs,
                    calendarData,
                    api
                });
                const { invitation } = processEventInvitation(
                    { vevent: veventIcs },
                    message,
                    contactEmails,
                    ownAddresses
                );
                return { ...invitation, calendarEvent };
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
        }
        return;
    }
    if (method === ICAL_METHOD.CANCEL) {
        let cancel = false;
        if (veventApi) {
            if (veventApi.status?.value === ICAL_EVENT_STATUS.CANCELLED) {
                return;
            }
            cancel = true;
        } else {
            const parentExdates = parentInvitationApi?.vevent.exdate;
            if (!recurrenceIdIcs || !parentExdates) {
                return;
            }
            const isCancelled = parentExdates.find((exdate) => {
                return +propertyToUTCDate(exdate) === +propertyToUTCDate(recurrenceIdIcs);
            });
            cancel = !isCancelled;
        }
        // cancel API event if needed
        if (cancel) {
            try {
                await updateEventApi({
                    calendarEvent,
                    vevent: { ...veventApi, status: { value: ICAL_EVENT_STATUS.CANCELLED } },
                    calendarData,
                    api
                });
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR);
            }
        }
    }
    return;
};
