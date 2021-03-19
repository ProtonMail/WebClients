import { getUnixTime } from 'date-fns';
import {
    CreateCalendarEventSyncData,
    CreateLinkedCalendarEventsSyncData,
    CreateSinglePersonalEventData,
    DeleteCalendarEventSyncData,
    syncMultipleEvents,
    updateAttendeePartstat,
    UpdateCalendarEventSyncData,
    updatePersonalEventPart,
} from 'proton-shared/lib/api/calendars';
import { processApiRequestsSafe } from 'proton-shared/lib/api/helpers/safeApiRequests';
import {
    getAttendeeEmail,
    modifyAttendeesPartstat,
    toApiPartstat,
    withPmAttendees,
} from 'proton-shared/lib/calendar/attendees';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import {
    CALENDAR_FLAGS,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
    ICAL_METHOD,
} from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import getPaginatedEventsByUID from 'proton-shared/lib/calendar/integration/getPaginatedEventsByUID';
import {
    findAttendee,
    getInvitedEventWithAlarms,
    getResetPartstatActions,
} from 'proton-shared/lib/calendar/integration/invite';
import { getIsRruleEqual } from 'proton-shared/lib/calendar/rruleEqual';
import {
    createCalendarEvent,
    createPersonalEvent,
    getHasSharedEventContent,
    getHasSharedKeyPacket,
} from 'proton-shared/lib/calendar/serialize';
import {
    getHasModifiedAttendees,
    getHasModifiedDateTimes,
    getHasModifiedDtstamp,
    propertyToUTCDate,
} from 'proton-shared/lib/calendar/vcalConverter';
import {
    getEventStatus,
    getHasAttendee,
    getHasRecurrenceId,
    getIsAlarmComponent,
    getSequence,
} from 'proton-shared/lib/calendar/vcalHelper';
import { withDtstamp } from 'proton-shared/lib/calendar/veventHelper';
import { API_CODES } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { noop } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { omit, pick } from 'proton-shared/lib/helpers/object';
import { getCurrentUnixTimestamp } from 'proton-shared/lib/helpers/time';
import { Address, Api, GetCanonicalEmails } from 'proton-shared/lib/interfaces';
import {
    Calendar,
    CalendarEvent,
    CalendarEventWithMetadata,
    CalendarWidgetData,
    DecryptedPersonalVeventMapResult,
    DecryptedVeventResult,
    Participant,
    PmInviteData,
    SyncMultipleApiResponse,
    UpdatePartstatApiResponse,
    UpdatePersonalPartApiResponse,
    VcalAttendeeProperty,
    VcalVeventComponent,
} from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { RequireSome, Unwrap } from 'proton-shared/lib/interfaces/utils';
import { getPrimaryKey } from 'proton-shared/lib/keys';
import { MessageExtendedWithData } from '../../models/message';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import {
    EventInvitation,
    getCanCreateSingleEdit,
    getInvitationHasAttendee,
    getIsInvitationFromFuture,
    getIsInvitationOutdated,
    getSingleEditWidgetData,
    processEventInvitation,
    UPDATE_ACTION,
} from './invite';

const { CANCELLED } = ICAL_EVENT_STATUS;
const { NONE, KEEP_PARTSTAT, RESET_PARTSTAT, UPDATE_PARTSTAT, CANCEL } = UPDATE_ACTION;

interface GetVeventWithAlarmsArgs {
    calendarEvent: CalendarEventWithMetadata;
    memberID?: string;
    getCalendarEventRaw: (event: CalendarEvent) => Promise<DecryptedVeventResult>;
    getCalendarEventPersonal: (event: CalendarEvent) => Promise<DecryptedPersonalVeventMapResult>;
}
const getVeventWithAlarms = async ({
    calendarEvent,
    memberID,
    getCalendarEventRaw,
    getCalendarEventPersonal,
}: GetVeventWithAlarmsArgs) => {
    const [{ veventComponent: vevent }, eventPersonalMap] = await Promise.all([
        getCalendarEventRaw(calendarEvent),
        getCalendarEventPersonal(calendarEvent),
    ]);
    const personalVevent = memberID ? eventPersonalMap[memberID] : undefined;
    const valarms = personalVevent ? personalVevent.veventComponent : {};
    return {
        ...valarms,
        ...vevent,
    };
};

const getIsNonSoughtEvent = (event: CalendarEventWithMetadata, vevent: VcalVeventComponent) => {
    if (!event.RecurrenceID) {
        return false;
    }
    if (!getHasRecurrenceId(vevent)) {
        return true;
    }
    return getUnixTime(propertyToUTCDate(vevent['recurrence-id'])) !== event.RecurrenceID;
};

export type FetchAllEventsByUID = ({
    uid,
    api,
    recurrenceID,
}: {
    uid: string;
    recurrenceID?: number;
    api: Api;
}) => Promise<{
    event?: CalendarEventWithMetadata;
    otherEvents: CalendarEventWithMetadata[];
    parentEvent?: CalendarEventWithMetadata;
    otherParentEvents?: CalendarEventWithMetadata[];
}>;

const fetchAllEventsByUID: FetchAllEventsByUID = async ({ uid, api, recurrenceID }) => {
    const promises: Promise<CalendarEventWithMetadata[]>[] = [getPaginatedEventsByUID({ api, uid })];
    if (recurrenceID) {
        promises.unshift(getPaginatedEventsByUID({ api, uid, recurrenceID }));
    }
    const [[event, ...otherEvents] = [], [parentEvent, ...otherParentEvents] = []] = await Promise.all(promises);
    if (parentEvent) {
        // If recurrenceID is passed, but the single edit is not found, return the parent
        return event
            ? { event, otherEvents, parentEvent, otherParentEvents }
            : { event: parentEvent, otherEvents: otherParentEvents };
    }
    return { event, otherEvents };
};

type FetchEventInvitation = (args: {
    veventComponent: VcalVeventComponent;
    api: Api;
    getCalendarInfo: (
        ID: string
    ) => Promise<Omit<CalendarWidgetData, 'calendar' | 'isCalendarDisabled' | 'calendarNeedsUserAction'>>;
    getCalendarEventRaw: (event: CalendarEvent) => Promise<DecryptedVeventResult>;
    getCalendarEventPersonal: (event: CalendarEvent) => Promise<DecryptedPersonalVeventMapResult>;
    calendars: Calendar[];
    defaultCalendar?: Calendar;
    message: MessageExtendedWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    isFreeUser: boolean;
}) => Promise<{
    invitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarData?: CalendarWidgetData;
    singleEditData?: CalendarEventWithMetadata[];
    hasDecryptionError?: boolean;
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
    ownAddresses,
    isFreeUser,
}) => {
    if (isFreeUser) {
        // The API may return calendar data for downgraded free users,
        // but at the moment those users are not entitled to have a calendar
        return {};
    }
    const recurrenceID = veventComponent['recurrence-id'];
    const timestamp = recurrenceID ? getUnixTime(propertyToUTCDate(recurrenceID)) : undefined;
    const allEventsWithUID = await fetchAllEventsByUID({
        uid: veventComponent.uid.value,
        api,
        recurrenceID: timestamp,
    });
    const { event: calendarEvent, parentEvent: calendarParentEvent } = allEventsWithUID;
    const calendar =
        calendars.find(({ ID }) => ID === (calendarEvent || calendarParentEvent)?.CalendarID) || defaultCalendar;
    if (!calendar) {
        return {};
    }
    const calendarData = {
        calendar,
        isCalendarDisabled: getIsCalendarDisabled(calendar),
        calendarNeedsUserAction:
            hasBit(calendar.Flags, CALENDAR_FLAGS.RESET_NEEDED) ||
            hasBit(calendar.Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE),
        ...(await getCalendarInfo(calendar.ID)),
    };
    // if we retrieved a single edit when not looking for one, or looking for another one, do not return it
    if (!calendarEvent || getIsNonSoughtEvent(calendarEvent, veventComponent)) {
        return { calendarData };
    }
    const singleEditData = getSingleEditWidgetData(allEventsWithUID);
    try {
        const vevents = await Promise.all(
            [calendarEvent, calendarParentEvent].filter(isTruthy).map((event) =>
                getVeventWithAlarms({
                    calendarEvent: event,
                    memberID: calendarData.memberID,
                    getCalendarEventRaw,
                    getCalendarEventPersonal,
                })
            )
        );
        const [vevent, parentVevent] = vevents;
        const result: Unwrap<ReturnType<FetchEventInvitation>> = { calendarData, singleEditData };
        const { invitation } = processEventInvitation({ vevent, calendarEvent }, message, contactEmails, ownAddresses);
        result.invitation = invitation;
        if (parentVevent && calendarParentEvent) {
            const { invitation: parentInvitation } = processEventInvitation(
                { vevent: parentVevent, calendarEvent: calendarParentEvent },
                message,
                contactEmails,
                ownAddresses
            );
            result.parentInvitation = parentInvitation;
        }
        return result;
    } catch (e) {
        // We need to detect if the error is due to a failed decryption of the event.
        // We don't have a great way of doing this as the error comes from openpgp
        return { calendarData, hasDecryptionError: e.message.includes('decrypt') };
    }
};

interface UpdateEventArgs {
    calendarEvent: CalendarEvent;
    vevent: VcalVeventComponent;
    api: Api;
    getCanonicalEmails: GetCanonicalEmails;
    calendarData: Required<CalendarWidgetData>;
    createSingleEdit?: boolean;
    updateTime?: number;
    updatePartstat?: ICAL_ATTENDEE_STATUS;
    attendee?: Participant;
    deleteIds?: string[];
    overwrite: boolean;
}
const updateEventApi = async ({
    calendarEvent,
    vevent,
    api,
    getCanonicalEmails,
    calendarData,
    createSingleEdit = false,
    updateTime,
    updatePartstat,
    attendee,
    overwrite,
    deleteIds = [],
}: UpdateEventArgs) => {
    const {
        calendar: { ID: calendarID },
        memberID,
        addressKeys,
        calendarKeys,
    } = calendarData;
    // organizer mode
    if (updateTime !== undefined && updatePartstat) {
        const { ID: eventID, Attendees } = calendarEvent;
        const token = attendee?.token;
        const attendeeID = Attendees.find(({ Token }) => Token === token)?.ID;
        if (!attendeeID) {
            throw new Error('Missing data for updating participation status');
        }
        const data = {
            Status: toApiPartstat(updatePartstat),
            UpdateTime: updateTime,
        };
        const { Attendee: updatedAttendee } = await api<UpdatePartstatApiResponse>(
            updateAttendeePartstat(calendarID, eventID, attendeeID, data)
        );
        return {
            ...calendarEvent,
            Attendees: Attendees.map((Attendee) => {
                if (Attendee.Token === token) {
                    return updatedAttendee;
                }
                return Attendee;
            }),
        };
    }
    // attendee mode
    const veventWithPmAttendees = await withPmAttendees(vevent, getCanonicalEmails);
    const creationKeys = await getCreationKeys({
        Event: createSingleEdit ? undefined : calendarEvent,
        addressKeys,
        newCalendarKeys: calendarKeys,
    });
    const data = await createCalendarEvent({
        eventComponent: veventWithPmAttendees,
        isCreateEvent: !!createSingleEdit,
        isSwitchCalendar: false,
        isInvitation: !calendarEvent.IsOrganizer,
        ...creationKeys,
    });
    if (createSingleEdit) {
        if (!getHasSharedKeyPacket(data) || !getHasSharedEventContent(data)) {
            throw new Error('Missing shared data');
        }
        const Events: CreateCalendarEventSyncData[] = [
            { Event: { Permissions: 3, IsOrganizer: 0, ...data }, Overwrite: overwrite ? 1 : 0 },
        ];
        const {
            Responses: [
                {
                    Response: { Code, Event },
                },
            ],
        } = await api<SyncMultipleApiResponse>({
            ...syncMultipleEvents(calendarID, { MemberID: memberID, Events }),
            silence: true,
        });
        if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
            throw new Error('Update unsuccessful');
        }
        return Event;
    }
    if (!getHasSharedEventContent(data)) {
        throw new Error('Missing shared data');
    }
    // If we are updating a recurring event with previous modifications, we must delete those first
    const deleteEvents = deleteIds.map((id) => ({ ID: id }));
    const Events: (UpdateCalendarEventSyncData | DeleteCalendarEventSyncData)[] = [
        ...deleteEvents,
        { Event: { Permissions: 3, ...data }, ID: calendarEvent.ID },
    ];
    const result = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendarID, { MemberID: memberID, Events }),
        silence: true,
    });
    const { Code, Event } = result.Responses.pop()?.Response || {};
    if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
        throw new Error('Update unsuccessful');
    }
    return Event;
};

interface UpdateEventInvitationArgs {
    isOrganizerMode: boolean;
    invitationIcs: RequireSome<EventInvitation, 'method'>;
    invitationApi: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarData: Required<CalendarWidgetData>;
    singleEditData?: CalendarEventWithMetadata[];
    pmData?: PmInviteData;
    api: Api;
    getCanonicalEmails: GetCanonicalEmails;
    message: MessageExtendedWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    overwrite: boolean;
}
export const updateEventInvitation = async ({
    isOrganizerMode,
    invitationIcs,
    invitationApi,
    parentInvitationApi,
    calendarData,
    singleEditData,
    pmData,
    api,
    getCanonicalEmails,
    message,
    contactEmails,
    ownAddresses,
    overwrite,
}: UpdateEventInvitationArgs): Promise<{
    action: UPDATE_ACTION;
    invitation?: RequireSome<EventInvitation, 'calendarEvent' | 'attendee'>;
}> => {
    const { method, vevent: veventIcs, attendee: attendeeIcs } = invitationIcs;
    const { calendarEvent, vevent: veventApi, attendee: attendeeApi } = invitationApi;
    const partstatIcs = attendeeIcs?.partstat;
    const partstatApi = attendeeApi?.partstat;
    const attendeesApi = veventApi.attendee;
    const recurrenceIdIcs = veventIcs['recurrence-id'];
    const sequenceDiff = getSequence(veventIcs) - getSequence(veventApi);

    if (
        calendarData.isCalendarDisabled ||
        getIsInvitationOutdated({ invitationIcs, invitationApi, isOrganizerMode }) ||
        getIsInvitationFromFuture({ invitationIcs, invitationApi, isOrganizerMode }) ||
        !attendeeIcs ||
        !attendeeApi ||
        pmData
    ) {
        // do not update
        return { action: NONE };
    }

    if (isOrganizerMode) {
        // Some external providers also want us to update attendee status with a COUNTER method
        const updateCounter =
            method === ICAL_METHOD.COUNTER &&
            partstatIcs &&
            [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.DECLINED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(
                partstatIcs
            );
        if (method === ICAL_METHOD.REPLY || updateCounter) {
            if (!veventApi) {
                if (!recurrenceIdIcs) {
                    return { action: NONE };
                }
                // In the future, create single edit. Not supported for now
                return { action: NONE };
            }
            if (recurrenceIdIcs) {
                // Replies to single edits not supported for the moment
                return { action: NONE };
            }
            if (!partstatIcs || !partstatApi || !attendeesApi) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
            try {
                // update attendee partstat if needed
                const updateTime = getUnixTime(
                    veventIcs.dtstamp ? propertyToUTCDate(veventIcs.dtstamp) : message.data.Time
                );
                if (attendeeApi.updateTime && updateTime <= attendeeApi.updateTime) {
                    return { action: NONE };
                }
                const updatedVevent = {
                    ...veventApi,
                    attendee: modifyAttendeesPartstat(attendeesApi, { [attendeeApi.emailAddress]: partstatIcs }),
                };
                const updatedCalendarEvent = await updateEventApi({
                    calendarEvent,
                    vevent: updatedVevent,
                    updateTime,
                    updatePartstat: attendeeIcs.partstat,
                    attendee: attendeeApi,
                    calendarData,
                    api,
                    getCanonicalEmails,
                    overwrite: false,
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
                return {
                    action: UPDATE_PARTSTAT,
                    invitation: { ...updatedInvitation, calendarEvent: updatedCalendarEvent },
                };
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
        }

        return { action: NONE };
    }
    // attendee mode
    if (method === ICAL_METHOD.REQUEST) {
        if (!veventApi) {
            return { action: NONE };
        }
        const hasUpdatedDtstamp = getHasModifiedDtstamp(veventIcs, veventApi);
        const hasUpdatedDateTimes = getHasModifiedDateTimes(veventIcs, veventApi);
        const hasUpdatedTitle = veventIcs.summary?.value !== veventApi.summary?.value;
        const hasUpdatedDescription = veventIcs.description?.value !== veventApi.description?.value;
        const hasUpdatedLocation = veventIcs.location?.value !== veventApi.location?.value;
        const hasUpdatedRrule = !getIsRruleEqual(veventIcs.rrule, veventApi.rrule);
        const hasUpdatedAttendees = getHasModifiedAttendees({ veventIcs, veventApi, attendeeIcs, attendeeApi });
        const isReinvited = getEventStatus(veventApi) === CANCELLED;
        const hasBreakingChange = hasUpdatedDtstamp ? sequenceDiff > 0 : false;
        const hasNonBreakingChange = hasUpdatedDtstamp
            ? hasUpdatedDateTimes ||
              hasUpdatedTitle ||
              hasUpdatedDescription ||
              hasUpdatedLocation ||
              hasUpdatedRrule ||
              hasUpdatedAttendees
            : false;
        const action = hasBreakingChange || isReinvited ? RESET_PARTSTAT : hasNonBreakingChange ? KEEP_PARTSTAT : NONE;
        if ([KEEP_PARTSTAT, RESET_PARTSTAT].includes(action)) {
            // update the api event by the ics one with the appropriate answer
            const createSingleEdit = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(veventApi);
            const canCreateSingleEdit = createSingleEdit ? getCanCreateSingleEdit(veventIcs, veventApi) : undefined;
            if (createSingleEdit && !canCreateSingleEdit) {
                // The parent has been updated. Nothing to do then
                return { action: NONE };
            }
            try {
                if (!partstatIcs) {
                    throw new Error('Missing attendee parameters');
                }
                const veventIcsWithApiAlarms: VcalVeventComponent = {
                    ...veventIcs,
                    components: [
                        ...(veventIcs.components || []),
                        ...(veventApi.components || []).filter((component) => getIsAlarmComponent(component)),
                    ],
                };
                // alarms may need to be dropped when resetting the partstat
                const updatedVevent = withDtstamp(
                    getInvitedEventWithAlarms(
                        veventIcsWithApiAlarms,
                        partstatIcs,
                        calendarData.calendarSettings,
                        partstatApi
                    )
                );
                const updatedCalendarEvent = await updateEventApi({
                    calendarEvent,
                    vevent: updatedVevent,
                    calendarData,
                    createSingleEdit,
                    deleteIds: singleEditData?.map(({ ID }) => ID),
                    api,
                    getCanonicalEmails,
                    overwrite,
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
            const canCreateSingleEdit = createSingleEdit ? getCanCreateSingleEdit(veventIcs, veventApi) : undefined;
            if (createSingleEdit && !canCreateSingleEdit) {
                // The parent has been updated. Nothing to do then
                return { action: NONE };
            }
            try {
                const updatedVevent = createSingleEdit
                    ? {
                          ...omit(veventIcs, ['rrule']),
                          status: { value: CANCELLED },
                      }
                    : {
                          ...veventApi,
                          dtstamp: veventIcs.dtstamp,
                          status: { value: CANCELLED },
                      };
                await updateEventApi({
                    calendarEvent,
                    vevent: getInvitedEventWithAlarms(updatedVevent, ICAL_ATTENDEE_STATUS.DECLINED),
                    calendarData,
                    createSingleEdit,
                    api,
                    getCanonicalEmails,
                    overwrite,
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

export const createCalendarEventFromInvitation = async ({
    vevent,
    vcalAttendee,
    partstat,
    api,
    getCanonicalEmails,
    calendarData,
    pmData,
    overwrite,
}: {
    vevent: VcalVeventComponent;
    vcalAttendee: VcalAttendeeProperty;
    partstat: ICAL_ATTENDEE_STATUS;
    calendarData?: CalendarWidgetData;
    pmData?: PmInviteData;
    api: Api;
    getCanonicalEmails: GetCanonicalEmails;
    overwrite: boolean;
}) => {
    const { calendar, memberID, addressKeys, calendarKeys, calendarSettings } = calendarData || {};
    if (!calendar || !memberID || !addressKeys || !calendarKeys || !calendarSettings) {
        throw new Error('Missing data for creating calendar event from invitation');
    }
    // save attendee answer
    const vcalAttendeeToSave = {
        ...vcalAttendee,
        parameters: {
            ...vcalAttendee.parameters,
            partstat,
        },
    };
    // add alarms to event if necessary
    const veventToSave = getInvitedEventWithAlarms(vevent, partstat, calendarSettings);
    const { index: attendeeIndex } = findAttendee(getAttendeeEmail(vcalAttendee), veventToSave.attendee);
    if (!veventToSave.attendee || attendeeIndex === undefined || attendeeIndex === -1) {
        throw new Error('Missing data for creating calendar event from invitation');
    }
    if (pmData) {
        // we just need to send the new attendee to the API
        veventToSave.attendee = [vcalAttendeeToSave];
    } else {
        veventToSave.attendee[attendeeIndex] = vcalAttendeeToSave;
    }
    const veventToSaveWithPmAttendees = await withPmAttendees(veventToSave, getCanonicalEmails);
    // create calendar event
    const payload = {
        eventComponent: veventToSaveWithPmAttendees,
        isCreateEvent: true,
        isSwitchCalendar: false,
        isInvitation: true,
        ...(await getCreationKeys({
            addressKeys,
            newCalendarKeys: calendarKeys,
            decryptedSharedKeyPacket: pmData?.sharedSessionKey,
        })),
    };
    const data = await createCalendarEvent(payload);
    if (!getHasSharedKeyPacket(data) || !getHasSharedEventContent(data)) {
        throw new Error('Missing shared data');
    }
    const Events: (CreateCalendarEventSyncData | CreateLinkedCalendarEventsSyncData)[] = pmData
        ? [
              {
                  Overwrite: overwrite ? 1 : 0,
                  Event: {
                      SharedEventID: pmData.sharedEventID,
                      UID: veventToSave.uid.value,
                      IsOrganizer: 0,
                      ...omit(data, ['SharedEventContent', 'AttendeesEventContent']),
                  },
              },
          ]
        : [
              {
                  Overwrite: overwrite ? 1 : 0,
                  Event: { IsOrganizer: 0, Permissions: 3, ...data },
              },
          ];
    const {
        Responses: [
            {
                Response: { Code, Event },
            },
        ],
    } = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendar.ID, { MemberID: memberID, Events }),
        silence: true,
    });
    if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
        throw new Error('Creating calendar event from invitation failed');
    }
    return {
        savedEvent: Event,
        savedVevent: veventToSaveWithPmAttendees,
        savedVcalAttendee: vcalAttendeeToSave,
    };
};

export const updatePartstatFromInvitation = async ({
    veventApi,
    calendarEvent,
    veventIcs,
    vcalAttendee,
    attendeeToken,
    partstat,
    oldPartstat,
    calendarData,
    singleEditData,
    api,
}: {
    veventApi: VcalVeventComponent;
    calendarEvent: CalendarEvent;
    veventIcs: VcalVeventComponent;
    vcalAttendee: VcalAttendeeProperty;
    attendeeToken?: string;
    partstat: ICAL_ATTENDEE_STATUS;
    oldPartstat?: ICAL_ATTENDEE_STATUS;
    calendarData?: CalendarWidgetData;
    singleEditData?: CalendarEventWithMetadata[];
    api: Api;
}) => {
    const { calendar, memberID, addressKeys, calendarSettings } = calendarData || {};
    const primaryAddressKey = getPrimaryKey(addressKeys);
    if (
        !getHasAttendee(veventApi) ||
        !getHasAttendee(veventIcs) ||
        !calendar ||
        !memberID ||
        !primaryAddressKey ||
        !calendarSettings
    ) {
        throw new Error('Missing data for updating calendar event from invitation');
    }
    // update attendee partstat
    const { ID: eventID, Attendees } = calendarEvent;
    const isSingleEdit = getHasRecurrenceId(veventIcs);
    const attendeeID = Attendees.find(({ Token }) => Token === attendeeToken)?.ID;
    if (!attendeeID) {
        throw new Error('Missing data for updating participation status');
    }
    const data = {
        Status: toApiPartstat(partstat),
        UpdateTime: getCurrentUnixTimestamp(),
    };
    const { Attendee: updatedAttendee } = await api<UpdatePartstatApiResponse>(
        updateAttendeePartstat(calendar.ID, eventID, attendeeID, data)
    );
    const updatedEvent = {
        ...calendarEvent,
        Attendees: Attendees.map((Attendee) => {
            if (Attendee.Token === attendeeToken) {
                return updatedAttendee;
            }
            return Attendee;
        }),
    };
    // reset single-edits partstats if necessary (if this step fails, we silently ignore it)
    // we also need to drop alarms for the ones that had them
    if (!isSingleEdit && singleEditData?.length && attendeeToken) {
        try {
            const { updatePartstatActions, updatePersonalPartActions } = getResetPartstatActions(
                singleEditData,
                attendeeToken,
                partstat
            );
            const resetPartstatRequests = updatePartstatActions.map(
                ({ eventID, calendarID, attendeeID, updateTime, partstat }) => () =>
                    api<UpdatePartstatApiResponse>({
                        ...updateAttendeePartstat(calendarID, eventID, attendeeID, {
                            Status: toApiPartstat(partstat),
                            UpdateTime: updateTime,
                        }),
                        silence: true,
                    })
            );
            const dropAlarmsRequests = updatePersonalPartActions.map(({ eventID, calendarID }) => () =>
                api<UpdatePersonalPartApiResponse>({
                    ...updatePersonalEventPart(calendarID, eventID, { MemberID: memberID }),
                    silence: true,
                })
            );
            // the routes called in requests do not have any specific jail limit
            // the limit per user session is 25k requests / 900s
            const resetPartstatPromise = processApiRequestsSafe(resetPartstatRequests, 1000, 100 * 1000);
            const dropAlarmsPromise = processApiRequestsSafe(dropAlarmsRequests, 1000, 100 * 1000);
            await Promise.all([resetPartstatPromise, dropAlarmsPromise]);
        } catch (e) {
            noop();
        }
    }
    // update alarms if necessary (if this step fails, we silently ignore it)
    let savedEvent;
    const emailAddress = getAttendeeEmail(vcalAttendee);
    const veventToUpdate = { ...veventIcs, ...pick(veventApi, ['components', 'exdate']) };
    const updatedVevent = {
        ...veventToUpdate,
        attendee: modifyAttendeesPartstat(veventToUpdate.attendee, { [emailAddress]: partstat }),
    };
    const veventToSave = getInvitedEventWithAlarms(updatedVevent, partstat, calendarSettings, oldPartstat);
    try {
        const personalData = await createPersonalEvent({
            eventComponent: veventToSave,
            signingKey: primaryAddressKey.privateKey,
        });
        const payload: CreateSinglePersonalEventData = {
            MemberID: memberID,
            PersonalEventContent: personalData,
        };
        const { Event } = await api<UpdatePersonalPartApiResponse>(
            updatePersonalEventPart(calendar.ID, eventID, payload)
        );
        savedEvent = Event;
    } catch (e) {
        noop();
    }

    const vcalAttendeeToSave = {
        ...vcalAttendee,
        parameters: { ...vcalAttendee.parameters, partstat },
    };
    return {
        savedEvent: savedEvent || updatedEvent,
        savedVevent: savedEvent ? veventToSave : updatedVevent,
        savedVcalAttendee: vcalAttendeeToSave,
    };
};
