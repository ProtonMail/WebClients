import { getUnixTime } from 'date-fns';
import {
    CreateCalendarEventSyncData,
    getEventByUID,
    GetEventByUIDArguments,
    syncMultipleEvents,
    UpdateCalendarEventSyncData
} from 'proton-shared/lib/api/calendars';
import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import { getInvitedEventWithAlarms } from 'proton-shared/lib/calendar/integration/invite';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import {
    getAttendeeHasPartStat,
    getAttendeePartstat,
    getEventStatus,
    getHasRecurrenceId,
    getIsAlarmComponent
} from 'proton-shared/lib/calendar/vcalHelper';
import { withDtstamp } from 'proton-shared/lib/calendar/veventHelper';
import { API_CODES } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { omit } from 'proton-shared/lib/helpers/object';
import { Address, Api } from 'proton-shared/lib/interfaces';
import {
    Calendar,
    CalendarEvent,
    CalendarWidgetData,
    SyncMultipleApiResponse
} from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { RequireSome, SimpleMap, Unwrap } from 'proton-shared/lib/interfaces/utils';
import { MessageExtended } from '../../models/message';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import {
    EventInvitation,
    getHasModifiedAttendees,
    getInvitationHasAttendee,
    getIsInvitationOutdated,
    getSequence,
    InvitationModel,
    processEventInvitation,
    UPDATE_ACTION
} from './invite';

const { CANCELLED } = ICAL_EVENT_STATUS;
const { NONE, KEEP_PARTSTAT, RESET_PARTSTAT, CANCEL } = UPDATE_ACTION;

interface GetVeventWithAlarmsArgs {
    calendarEvent: CalendarEvent;
    memberID?: string;
    getCalendarEventRaw: (event: CalendarEvent) => Promise<VcalVeventComponent>;
    getCalendarEventPersonal: (event: CalendarEvent) => Promise<SimpleMap<VcalVeventComponent>>;
}
const getVeventWithAlarms = async ({
    calendarEvent,
    memberID,
    getCalendarEventRaw,
    getCalendarEventPersonal
}: GetVeventWithAlarmsArgs) => {
    const [vevent, eventPersonalMap] = await Promise.all([
        getCalendarEventRaw(calendarEvent),
        getCalendarEventPersonal(calendarEvent)
    ]);
    const valarms = memberID ? eventPersonalMap[memberID] : {};
    return {
        ...valarms,
        ...vevent
    };
};

type FetchEventInvitation = (args: {
    veventComponent: VcalVeventComponent;
    api: Api;
    getCalendarInfo: (ID: string) => Promise<Omit<CalendarWidgetData, 'calendar' | 'isCalendarDisabled'>>;
    getCalendarEventRaw: (event: CalendarEvent) => Promise<VcalVeventComponent>;
    getCalendarEventPersonal: (event: CalendarEvent) => Promise<SimpleMap<VcalVeventComponent>>;
    calendars: Calendar[];
    defaultCalendar?: Calendar;
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}) => Promise<{
    invitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarData?: CalendarWidgetData;
}>;
export const fetchEventInvitation: FetchEventInvitation = async ({
    veventComponent,
    api,
    getCalendarInfo,
    getCalendarEventRaw,
    getCalendarEventPersonal,
    calendars,
    defaultCalendar,
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
    const [calendarEvent, calendarParentEvent] = calendarEvents;
    const calendar =
        calendars.find(({ ID }) => ID === (calendarEvent || calendarParentEvent)?.CalendarID) || defaultCalendar;
    if (!calendar) {
        return {};
    }
    const calendarData = {
        calendar,
        isCalendarDisabled: getIsCalendarDisabled(calendar),
        ...(await getCalendarInfo(calendar.ID))
    };
    if (!calendarEvents.length) {
        return { calendarData };
    }
    try {
        const vevents = await Promise.all(
            calendarEvents.map((event) =>
                getVeventWithAlarms({
                    calendarEvent: event,
                    memberID: calendarData.memberID,
                    getCalendarEventRaw,
                    getCalendarEventPersonal
                })
            )
        );
        const [vevent, parentVevent] = vevents;
        const result: Unwrap<ReturnType<FetchEventInvitation>> = { calendarData };
        const { invitation } = processEventInvitation({ vevent }, message, contactEmails, ownAddresses);
        result.invitation = { ...invitation, calendarEvent: calendarEvent };
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
    } catch (e) {
        return { calendarData };
    }
};

interface UpdateEventArgs {
    calendarEvent: CalendarEvent;
    vevent: VcalVeventComponent;
    api: Api;
    calendarData: Required<CalendarWidgetData>;
    createSingleEdit?: boolean;
}
const updateEventApi = async ({
    calendarEvent,
    vevent,
    api,
    calendarData,
    createSingleEdit = false
}: UpdateEventArgs) => {
    const {
        calendar: { ID: calendarID },
        memberID,
        addressKeys,
        calendarKeys
    } = calendarData;
    const veventWithPmAttendees = await withPmAttendees(vevent, api);
    const creationKeys = await getCreationKeys({
        Event: createSingleEdit ? undefined : calendarEvent,
        addressKeys,
        newCalendarKeys: calendarKeys
    });
    const data = await createCalendarEvent({
        eventComponent: veventWithPmAttendees,
        isSwitchCalendar: false,
        ...creationKeys
    });
    const Events: (CreateCalendarEventSyncData | UpdateCalendarEventSyncData)[] = createSingleEdit
        ? [{ Event: { Permissions: 3, ...data }, Overwrite: 1 }]
        : [{ Event: { Permissions: 3, ...data }, ID: calendarEvent.ID }];
    const {
        Responses: [
            {
                Response: { Code, Event }
            }
        ]
    } = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendarID, { MemberID: memberID, Events }),
        silence: true
    });
    if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
        throw new Error('Update unsuccessful');
    }
    return Event;
};

interface UpdateEventInvitationArgs
    extends Omit<
        RequireSome<InvitationModel, 'invitationIcs' | 'invitationApi'>,
        'timeStatus' | 'canCreateCalendar' | 'hasNoCalendars'
    > {
    isOrganizerMode: boolean;
    isAddressDisabled: boolean;
    isOutdated?: boolean;
    updateAction?: UPDATE_ACTION;
    hideSummary?: boolean;
    invitationIcs: RequireSome<EventInvitation, 'method'>;
    invitationApi: RequireSome<EventInvitation, 'calendarEvent' | 'attendee'>;
    parentInvitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarData: Required<CalendarWidgetData>;
    api: Api;
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}
export const updateEventInvitation = async ({
    isOrganizerMode,
    calendarData,
    isAddressDisabled,
    invitationIcs,
    invitationApi,
    parentInvitationApi,
    api,
    message,
    contactEmails,
    ownAddresses
}: UpdateEventInvitationArgs): Promise<{
    action: UPDATE_ACTION;
    invitation?: RequireSome<EventInvitation, 'calendarEvent' | 'attendee'>;
}> => {
    const { method, vevent: veventIcs, attendee: attendeeIcs } = invitationIcs;
    const {
        calendarEvent,
        vevent: veventApi,
        attendee: { vcalComponent: vcalAttendeeApi }
    } = invitationApi;
    const vcalAttendeeIcs = attendeeIcs?.vcalComponent;
    const recurrenceIdIcs = veventIcs['recurrence-id'];

    if (isOrganizerMode) {
        // TODO
        if (method === ICAL_METHOD.REPLY) {
            if (!veventApi) {
                if (!recurrenceIdIcs) {
                    return { action: NONE };
                }
                // TODO: create single edit
            }
            if (!vcalAttendeeIcs) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
            if (!getAttendeeHasPartStat(vcalAttendeeIcs) || !getAttendeeHasPartStat(vcalAttendeeApi)) {
                throw new Error('Participation status of attendees required');
            }
            const partStatIcs = vcalAttendeeIcs.parameters.partstat;
            const partStatApi = vcalAttendeeApi.parameters.partstat;
            if (partStatApi !== partStatIcs) {
                // TODO: update eventApi with partstatIcs
            }
        }
    }
    // attendee mode
    if (isAddressDisabled || calendarData.isCalendarDisabled || getIsInvitationOutdated(veventIcs, veventApi)) {
        // do not update
        return { action: NONE };
    }

    if (method === ICAL_METHOD.REQUEST) {
        if (!veventApi) {
            // TODO: check for SharedEventID and create new event accordingly
            return { action: NONE };
        }
        const sequenceDiff = getSequence(veventIcs) - getSequence(veventApi);
        const hasUpdatedTitle = veventIcs.summary?.value !== veventApi.summary?.value;
        const hasUpdatedDescription = veventIcs.description?.value !== veventApi.description?.value;
        const hasUpdatedLocation = veventIcs.location?.value !== veventApi.location?.value;
        const hasUpdatedAttendees = getHasModifiedAttendees(veventIcs.attendee, veventApi.attendee);
        const isReinvited = getEventStatus(veventApi) === CANCELLED;
        const hasBreakingChange = sequenceDiff > 0;
        const hasNonBreakingChange =
            hasUpdatedTitle || hasUpdatedDescription || hasUpdatedLocation || hasUpdatedAttendees;
        const action = hasBreakingChange || isReinvited ? RESET_PARTSTAT : hasNonBreakingChange ? KEEP_PARTSTAT : NONE;
        if ([KEEP_PARTSTAT, RESET_PARTSTAT].includes(action)) {
            // update the api event by the ics one with the appropriate answer
            const createSingleEdit = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(veventApi);
            try {
                if (!vcalAttendeeIcs) {
                    throw new Error('Missing attendee parameters');
                }
                const veventIcsWithApiAlarms: VcalVeventComponent = {
                    ...veventIcs,
                    components: [
                        ...(veventIcs.components || []),
                        ...(veventApi.components || []).filter((component) => getIsAlarmComponent(component))
                    ]
                };
                const updatedVevent = withDtstamp(
                    getInvitedEventWithAlarms(
                        veventIcsWithApiAlarms,
                        getAttendeePartstat(vcalAttendeeIcs),
                        calendarData.calendarSettings,
                        getAttendeePartstat(vcalAttendeeApi)
                    )
                );
                const updatedCalendarEvent = await updateEventApi({
                    calendarEvent,
                    vevent: updatedVevent,
                    calendarData,
                    createSingleEdit,
                    api
                });
                const { invitation: updatedInvitation } = processEventInvitation(
                    { vevent: updatedVevent, calendarEvent: updatedCalendarEvent },
                    message,
                    contactEmails,
                    ownAddresses
                );
                if (!getInvitationHasAttendee(updatedInvitation)) {
                    throw new Error('Missing attendee after update');
                }
                return { action, invitation: { ...updatedInvitation, calendarEvent: updatedCalendarEvent } };
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
        }
        return { action };
    }
    if (method === ICAL_METHOD.CANCEL) {
        let cancel = false;
        if (veventApi) {
            if (getEventStatus(veventApi) === CANCELLED) {
                return { action: NONE };
            }
            cancel = true;
        } else {
            const parentExdates = parentInvitationApi?.vevent.exdate;
            if (!recurrenceIdIcs || !parentExdates) {
                return { action: NONE };
            }
            const isCancelled = parentExdates.find((exdate) => {
                return +propertyToUTCDate(exdate) === +propertyToUTCDate(recurrenceIdIcs);
            });
            cancel = !isCancelled;
        }
        // cancel API event if needed
        if (cancel) {
            const createSingleEdit = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(veventApi);
            try {
                const updatedVevent = createSingleEdit
                    ? {
                          //TODO properly
                          ...omit(veventIcs, ['rrule']),
                          status: { value: CANCELLED }
                      }
                    : {
                          ...veventApi,
                          dtstamp: veventIcs.dtstamp,
                          status: { value: CANCELLED }
                      };
                await updateEventApi({
                    calendarEvent,
                    vevent: getInvitedEventWithAlarms(updatedVevent, ICAL_ATTENDEE_STATUS.DECLINED),
                    calendarData,
                    createSingleEdit,
                    api
                });
                const { invitation: updatedInvitation } = processEventInvitation(
                    { vevent: updatedVevent },
                    message,
                    contactEmails,
                    ownAddresses
                );
                if (!getInvitationHasAttendee(updatedInvitation)) {
                    throw new Error('Missing attendee after update');
                }
                return { action: CANCEL, invitation: { ...updatedInvitation, calendarEvent } };
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR);
            }
        }
        return { action: RESET_PARTSTAT };
    }
    return { action: NONE };
};
