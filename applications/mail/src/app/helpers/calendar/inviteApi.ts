import { getLinkedDateTimeProperty } from '@proton/shared/lib/calendar/icsSurgery/vevent';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import { GetCalendarInfo } from '@proton/shared/lib/interfaces/hooks/GetCalendarInfo';
import { getUnixTime } from 'date-fns';
import { syncMultipleEvents, updateAttendeePartstat, updatePersonalEventPart } from '@proton/shared/lib/api/calendars';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import {
    getAttendeeEmail,
    modifyAttendeesPartstat,
    toApiPartstat,
    withPmAttendees,
} from '@proton/shared/lib/calendar/attendees';
import {
    getCalendarWithReactivatedKeys,
    getDoesCalendarNeedUserAction,
    getIsCalendarDisabled,
} from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import {
    CreateCalendarEventSyncData,
    CreateLinkedCalendarEventsSyncData,
    CreateSinglePersonalEventData,
    DeleteCalendarEventSyncData,
    UpdateCalendarEventSyncData,
} from '@proton/shared/lib/interfaces/calendar/Api';
import getCreationKeys from '@proton/shared/lib/calendar/integration/getCreationKeys';
import getPaginatedEventsByUID from '@proton/shared/lib/calendar/integration/getPaginatedEventsByUID';
import {
    findAttendee,
    getInvitedEventWithAlarms,
    getResetPartstatActions,
} from '@proton/shared/lib/calendar/integration/invite';
import { getIsRruleEqual } from '@proton/shared/lib/calendar/rruleEqual';
import {
    createCalendarEvent,
    createPersonalEvent,
    getHasSharedEventContent,
    getHasSharedKeyPacket,
} from '@proton/shared/lib/calendar/serialize';
import {
    getHasModifiedAttendees,
    getHasModifiedDateTimes,
    getHasModifiedDtstamp,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import {
    getEventStatus,
    getHasAttendee,
    getHasRecurrenceId,
    getIsAlarmComponent,
    getSequence,
} from '@proton/shared/lib/calendar/vcalHelper';
import { getIsEventCancelled, withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { API_CODES } from '@proton/shared/lib/constants';
import { noop, unary } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import { Address, Api } from '@proton/shared/lib/interfaces';
import {
    Calendar,
    CalendarEvent,
    CalendarEventEncryptionData,
    CalendarEventWithMetadata,
    CalendarUserSettings,
    CalendarWidgetData,
    DecryptedPersonalVeventMapResult,
    Participant,
    PmInviteData,
    SyncMultipleApiResponse,
    UpdateEventPartApiResponse,
    VcalAttendeeProperty,
    VcalDateOrDateTimeProperty,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetCanonicalEmailsMap } from '@proton/shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { RequireSome, Unwrap } from '@proton/shared/lib/interfaces/utils';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import setupCalendarHelper from '@proton/shared/lib/calendar/keys/setupCalendarHelper';
import {
    EventInvitation,
    getCanCreateSingleEdit,
    getInvitationHasAttendee,
    getIsInvitationFromFuture,
    getIsInvitationOutdated,
    getIsNonSoughtEvent,
    getIsProtonInvite,
    getSingleEditWidgetData,
    processEventInvitation,
    UPDATE_ACTION,
} from './invite';
import { MessageStateWithData } from '../../logic/messages/messagesTypes';

const { CANCELLED } = ICAL_EVENT_STATUS;
const { NONE, KEEP_PARTSTAT, RESET_PARTSTAT, UPDATE_PARTSTAT, CANCEL } = UPDATE_ACTION;

/**
 * Get calendars and calendar user settings. If no calendar exists, create one
 */
export const getOrCreatePersonalCalendarsAndSettings = async ({
    api,
    addresses,
    getAddressKeys,
    getCalendars,
    getCalendarUserSettings,
}: {
    api: Api;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendars: () => Promise<Calendar[] | undefined>;
    getCalendarUserSettings: () => Promise<CalendarUserSettings>;
}) => {
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    let [calendars = [], calendarUserSettings] = await Promise.all([getCalendars(), getCalendarUserSettings()]);
    calendars = calendars.filter(unary(getIsPersonalCalendar));
    if (!calendars.length) {
        // create a calendar automatically
        try {
            const { calendar, updatedCalendarUserSettings } = await setupCalendarHelper({
                api: silentApi,
                addresses,
                getAddressKeys,
            });
            calendarUserSettings = { ...calendarUserSettings, ...updatedCalendarUserSettings };
            calendars = [calendar];
        } catch {
            // fail silently
            noop();
        }
    }
    return { calendars, calendarUserSettings };
};

interface GetVeventWithAlarmsArgs {
    calendarEvent: CalendarEventWithMetadata;
    memberID?: string;
    getCalendarEventRaw: GetCalendarEventRaw;
    getCalendarEventPersonal: (event: CalendarEvent) => Promise<DecryptedPersonalVeventMapResult>;
}
const getVeventWithAlarms = async ({
    calendarEvent,
    memberID,
    getCalendarEventRaw,
    getCalendarEventPersonal,
}: GetVeventWithAlarmsArgs) => {
    const [{ veventComponent: vevent, encryptionData }, eventPersonalMap] = await Promise.all([
        getCalendarEventRaw(calendarEvent),
        getCalendarEventPersonal(calendarEvent),
    ]);
    const personalVevent = memberID ? eventPersonalMap[memberID] : undefined;
    const valarms = personalVevent ? personalVevent.veventComponent : {};
    return {
        veventWithAlarms: {
            ...valarms,
            ...vevent,
        },
        encryptionData,
    };
};

export type FetchAllEventsByUID = ({
    uid,
    api,
    recurrenceId,
}: {
    uid: string;
    recurrenceId?: VcalDateOrDateTimeProperty;
    api: Api;
}) => Promise<{
    event?: CalendarEventWithMetadata;
    otherEvents: CalendarEventWithMetadata[];
    parentEvent?: CalendarEventWithMetadata;
    otherParentEvents?: CalendarEventWithMetadata[];
    supportedRecurrenceId?: VcalDateOrDateTimeProperty;
}>;

export const fetchAllEventsByUID: FetchAllEventsByUID = async ({ uid, api, recurrenceId }) => {
    const timestamp = recurrenceId ? getUnixTime(propertyToUTCDate(recurrenceId)) : undefined;
    const promises: Promise<CalendarEventWithMetadata[]>[] = [getPaginatedEventsByUID({ api, uid })];
    if (recurrenceId) {
        promises.unshift(getPaginatedEventsByUID({ api, uid, recurrenceID: timestamp }));
    }
    const [[event, ...otherEvents] = [], [parentEvent, ...otherParentEvents] = []] = await Promise.all(promises);
    if (!parentEvent) {
        return { event, otherEvents };
    }
    // If recurrenceID is passed, but the single edit is not found, it is possible that the ICS
    // contained the wrong RECURRENCE-ID (Outlook sends a wrong one for single edits of all-day events).
    // Try to recover. If we cannot find the single edit, return the parent
    if (!event && recurrenceId) {
        try {
            const supportedRecurrenceId = getLinkedDateTimeProperty({
                component: 'vevent',
                property: recurrenceId,
                isAllDay: !!parentEvent.FullDay,
                tzid: parentEvent.StartTimezone,
            });
            const supportedTimestamp = getUnixTime(propertyToUTCDate(supportedRecurrenceId));
            const [recoveredEvent, ...otherRecoveredEvents] = await getPaginatedEventsByUID({
                api,
                uid,
                recurrenceID: supportedTimestamp,
            });
            return recoveredEvent
                ? {
                      event: recoveredEvent,
                      otherEvents: otherRecoveredEvents,
                      parentEvent,
                      otherParentEvents,
                      supportedRecurrenceId,
                  }
                : { event: parentEvent, otherEvents: otherParentEvents, supportedRecurrenceId };
        } catch (e: any) {
            noop();
        }
    }
    return { event, otherEvents, parentEvent, otherParentEvents };
};

type FetchEventInvitation = (args: {
    veventComponent: VcalVeventComponent;
    api: Api;
    getAddressKeys: GetAddressKeys;
    getCalendarInfo: GetCalendarInfo;
    getCalendarEventRaw: GetCalendarEventRaw;
    getCalendarEventPersonal: (event: CalendarEvent) => Promise<DecryptedPersonalVeventMapResult>;
    calendars: Calendar[];
    defaultCalendar?: Calendar;
    message: MessageStateWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}) => Promise<{
    invitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarData?: CalendarWidgetData;
    calendarEvent?: CalendarEventWithMetadata;
    singleEditData?: CalendarEventWithMetadata[];
    reencryptionData?: Required<Pick<CalendarEventEncryptionData, 'encryptingAddressID' | 'sharedSessionKey'>>;
    hasDecryptionError?: boolean;
    supportedRecurrenceId?: VcalDateOrDateTimeProperty;
}>;
export const fetchEventInvitation: FetchEventInvitation = async ({
    veventComponent,
    api,
    getAddressKeys,
    getCalendarInfo,
    getCalendarEventRaw,
    getCalendarEventPersonal,
    calendars,
    defaultCalendar,
    message,
    contactEmails,
    ownAddresses,
}) => {
    const allEventsWithUID = await fetchAllEventsByUID({
        uid: veventComponent.uid.value,
        api,
        recurrenceId: veventComponent['recurrence-id'],
    });
    const { event: calendarEvent, parentEvent: calendarParentEvent, supportedRecurrenceId } = allEventsWithUID;
    const calendarWithPossiblyNotReactivatedKeys =
        calendars.find(({ ID }) => ID === (calendarEvent || calendarParentEvent)?.CalendarID) || defaultCalendar;
    if (!calendarWithPossiblyNotReactivatedKeys) {
        return {};
    }
    const calendar = await getCalendarWithReactivatedKeys({
        calendar: calendarWithPossiblyNotReactivatedKeys,
        api,
        addresses: ownAddresses,
        getAddressKeys,
        // if we fail to reactivate keys, fail silently and proceed with the calendar in a passphrase-needs-update state
        handleError: noop,
    });

    const calendarData = {
        calendar,
        isCalendarDisabled: getIsCalendarDisabled(calendar),
        calendarNeedsUserAction: getDoesCalendarNeedUserAction(calendar),
        ...(await getCalendarInfo(calendar.ID)),
    };

    // if we retrieved a single edit when not looking for one, or looking for another one, do not return it
    if (!calendarEvent || getIsNonSoughtEvent(calendarEvent, veventComponent, supportedRecurrenceId)) {
        return { calendarData };
    }
    const singleEditData = getSingleEditWidgetData(allEventsWithUID);
    try {
        const veventResults = await Promise.all(
            [calendarEvent, calendarParentEvent].filter(isTruthy).map((event) =>
                getVeventWithAlarms({
                    calendarEvent: event,
                    memberID: calendarData.memberID,
                    getCalendarEventRaw,
                    getCalendarEventPersonal,
                })
            )
        );
        const [
            {
                veventWithAlarms: vevent,
                encryptionData: { sharedSessionKey, encryptingAddressID },
            },
            parentVeventResult,
        ] = veventResults;
        const result: Unwrap<ReturnType<FetchEventInvitation>> = {
            calendarData,
            calendarEvent,
            singleEditData,
            supportedRecurrenceId,
        };
        const { invitation } = processEventInvitation({ vevent, calendarEvent }, message, contactEmails, ownAddresses);
        result.invitation = invitation;
        if (parentVeventResult && calendarParentEvent) {
            const { invitation: parentInvitation } = processEventInvitation(
                { vevent: parentVeventResult.veventWithAlarms, calendarEvent: calendarParentEvent },
                message,
                contactEmails,
                ownAddresses
            );
            result.parentInvitation = parentInvitation;
        }
        if (encryptingAddressID && sharedSessionKey) {
            result.reencryptionData = {
                encryptingAddressID,
                sharedSessionKey,
            };
        }
        return result;
    } catch (e: any) {
        // We need to detect if the error is due to a failed decryption of the event.
        // We don't have a great way of doing this as the error comes from openpgp
        return { calendarData, hasDecryptionError: e.message.includes('decrypt'), calendarEvent };
    }
};

interface UpdateEventArgs {
    calendarEvent: CalendarEvent;
    vevent: VcalVeventComponent;
    api: Api;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
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
    getCanonicalEmailsMap,
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
        const { Event } = await api<UpdateEventPartApiResponse>(
            updateAttendeePartstat(calendarID, eventID, attendeeID, data)
        );
        return Event;
    }
    // attendee mode
    const veventWithPmAttendees = await withPmAttendees(vevent, getCanonicalEmailsMap, true);
    const creationKeys = await getCreationKeys({
        calendarEvent: createSingleEdit ? undefined : calendarEvent,
        newAddressKeys: addressKeys,
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
            { Event: { Permissions: 1, IsOrganizer: 0, ...data }, Overwrite: overwrite ? 1 : 0 },
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
        { Event: { Permissions: 1, ...data }, ID: calendarEvent.ID },
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
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
    message: MessageStateWithData;
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
    getCanonicalEmailsMap,
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
        getIsEventCancelled(calendarEvent) ||
        !attendeeIcs ||
        !attendeeApi ||
        getIsProtonInvite({
            invitationIcs,
            calendarEvent,
            pmData,
        })
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
                    getCanonicalEmailsMap,
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
            } catch (error: any) {
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
        const hasBreakingChange = hasUpdatedDtstamp ? sequenceDiff > 0 : false;
        const hasNonBreakingChange = hasUpdatedDtstamp
            ? hasUpdatedDateTimes ||
              hasUpdatedTitle ||
              hasUpdatedDescription ||
              hasUpdatedLocation ||
              hasUpdatedRrule ||
              hasUpdatedAttendees
            : false;
        const action = hasBreakingChange ? RESET_PARTSTAT : hasNonBreakingChange ? KEEP_PARTSTAT : NONE;
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
                    getInvitedEventWithAlarms({
                        vevent: veventIcsWithApiAlarms,
                        partstat: partstatIcs,
                        calendarSettings: calendarData.calendarSettings,
                        oldPartstat: partstatApi,
                    })
                );
                const updatedPmVevent = await withPmAttendees(updatedVevent, getCanonicalEmailsMap, true);
                const updatedCalendarEvent = await updateEventApi({
                    calendarEvent,
                    vevent: updatedPmVevent,
                    calendarData,
                    createSingleEdit,
                    deleteIds: singleEditData?.map(({ ID }) => ID),
                    api,
                    getCanonicalEmailsMap,
                    overwrite,
                });
                const { invitation: updatedInvitation } = processEventInvitation(
                    { vevent: updatedPmVevent, calendarEvent: updatedCalendarEvent },
                    message,
                    contactEmails,
                    ownAddresses
                );
                if (!getInvitationHasAttendee(updatedInvitation)) {
                    throw new Error('Missing attendee after update');
                }
                return { action, invitation: { ...updatedInvitation, calendarEvent: updatedCalendarEvent } };
            } catch (error: any) {
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
                          // on cancellation, sequence might be incremented, only the organizer knows
                          sequence: { value: veventIcs.sequence?.value || 0 },
                          status: { value: CANCELLED },
                      };
                await updateEventApi({
                    calendarEvent,
                    vevent: getInvitedEventWithAlarms({
                        vevent: updatedVevent,
                        partstat: ICAL_ATTENDEE_STATUS.DECLINED,
                    }),
                    calendarData,
                    createSingleEdit,
                    api,
                    getCanonicalEmailsMap,
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
            } catch (error: any) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR);
            }
        }
        return { action: RESET_PARTSTAT };
    }
    return { action: NONE };
};

export const deleteCalendarEventFromInvitation = ({
    calendarEventID,
    calendarData,
    api,
}: {
    calendarEventID: string;
    calendarData: Required<CalendarWidgetData>;
    api: Api;
}) => {
    void api<SyncMultipleApiResponse>(
        syncMultipleEvents(calendarData.calendar.ID, {
            MemberID: calendarData.memberID,
            Events: [{ ID: calendarEventID }],
        })
    );
};

export const createCalendarEventFromInvitation = async ({
    vevent,
    vcalAttendee,
    partstat,
    api,
    getCanonicalEmailsMap,
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
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
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
    const veventToSave = getInvitedEventWithAlarms({ vevent, partstat, calendarSettings });
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
    const veventToSaveWithPmAttendees = await withPmAttendees(veventToSave, getCanonicalEmailsMap, true);
    const vcalPmAttendeeToSave = pmData
        ? veventToSaveWithPmAttendees?.attendee?.[0]
        : veventToSaveWithPmAttendees?.attendee?.[attendeeIndex];
    if (!vcalPmAttendeeToSave) {
        throw new Error('Failed to generate PM attendee');
    }
    // create calendar event
    const payload = {
        eventComponent: veventToSaveWithPmAttendees,
        isCreateEvent: true,
        isSwitchCalendar: false,
        isInvitation: true,
        ...(await getCreationKeys({
            newAddressKeys: addressKeys,
            newCalendarKeys: calendarKeys,
            decryptedSharedKeyPacket: pmData?.sharedSessionKey,
        })),
    };
    const data = await createCalendarEvent(payload);
    if (!getHasSharedKeyPacket(data) || !getHasSharedEventContent(data)) {
        throw new Error('Missing shared data');
    }
    const Events: (CreateCalendarEventSyncData | CreateLinkedCalendarEventsSyncData)[] = pmData?.sharedEventID
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
                  Event: { IsOrganizer: 0, Permissions: 1, ...data },
              },
          ];
    const {
        Responses: [
            {
                Response: { Code, Event, Error: errorMessage },
            },
        ],
    } = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendar.ID, { MemberID: memberID, Events }),
        silence: true,
    });
    if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
        throw new Error(errorMessage || 'Creating calendar event from invitation failed');
    }
    return {
        savedEvent: Event,
        savedVevent: veventToSaveWithPmAttendees,
        savedVcalAttendee: vcalPmAttendeeToSave,
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
    timestamp,
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
    timestamp: number;
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
        UpdateTime: getUnixTime(timestamp),
    };
    const { Event: updatedEvent } = await api<UpdateEventPartApiResponse>({
        ...updateAttendeePartstat(calendar.ID, eventID, attendeeID, data),
        silence: true,
    });
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
                ({ eventID, calendarID, attendeeID, updateTime, partstat }) =>
                    () =>
                        api<UpdateEventPartApiResponse>({
                            ...updateAttendeePartstat(calendarID, eventID, attendeeID, {
                                Status: toApiPartstat(partstat),
                                UpdateTime: updateTime,
                            }),
                            silence: true,
                        })
            );
            const dropAlarmsRequests = updatePersonalPartActions.map(
                ({ eventID, calendarID }) =>
                    () =>
                        api<UpdateEventPartApiResponse>({
                            ...updatePersonalEventPart(calendarID, eventID, { MemberID: memberID }),
                            silence: true,
                        })
            );
            // the routes called in requests do not have any specific jail limit
            // the limit per user session is 25k requests / 900s
            const resetPartstatPromise = processApiRequestsSafe(resetPartstatRequests, 1000, 100 * 1000);
            const dropAlarmsPromise = processApiRequestsSafe(dropAlarmsRequests, 1000, 100 * 1000);
            await Promise.all([resetPartstatPromise, dropAlarmsPromise]);
        } catch (e: any) {
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
    const veventToSave = getInvitedEventWithAlarms({
        vevent: updatedVevent,
        partstat,
        calendarSettings,
        oldPartstat,
    });
    try {
        const personalData = await createPersonalEvent({
            eventComponent: veventToSave,
            signingKey: primaryAddressKey.privateKey,
        });
        const payload: CreateSinglePersonalEventData = {
            MemberID: memberID,
            PersonalEventContent: personalData,
        };
        const { Event } = await api<UpdateEventPartApiResponse>(updatePersonalEventPart(calendar.ID, eventID, payload));
        savedEvent = Event;
    } catch (e: any) {
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
