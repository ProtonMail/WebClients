import { getUnixTime } from 'date-fns';

import { syncMultipleEvents, updateAttendeePartstat, updatePersonalEventPart } from '@proton/shared/lib/api/calendars';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { getPaginatedEventsByUID } from '@proton/shared/lib/calendar/api';
import {
    getHasDefaultNotifications,
    getHasSharedEventContent,
    getHasSharedKeyPacket,
} from '@proton/shared/lib/calendar/apiModels';
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
    getOwnedPersonalCalendars,
    getVisualCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import {
    CALENDAR_TYPE,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
    ICAL_METHOD,
} from '@proton/shared/lib/calendar/constants';
import { getCreationKeys } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import setupCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupCalendarHelper';
import { getIsProtonUID, naiveGetIsDecryptionError } from '@proton/shared/lib/calendar/helper';
import { EventInvitationError } from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { INVITATION_ERROR_TYPE } from '@proton/shared/lib/calendar/icsSurgery/errors/icsSurgeryErrorTypes';
import { getLinkedDateTimeProperty } from '@proton/shared/lib/calendar/icsSurgery/vevent';
import {
    findAttendee,
    getHasModifiedAttendees,
    getInvitedVeventWithAlarms,
    getResetPartstatActions,
} from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getIsRruleEqual } from '@proton/shared/lib/calendar/recurrence/rruleEqual';
import { createCalendarEvent } from '@proton/shared/lib/calendar/serialize';
import {
    getHasModifiedDateTimes,
    getHasModifiedDtstamp,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import {
    getHasAttendee,
    getHasRecurrenceId,
    getIsAlarmComponent,
    getIsVeventCancelled,
    getPmSharedEventID,
} from '@proton/shared/lib/calendar/vcalHelper';
import {
    getIsEventCancelled,
    getSequence,
    toApiNotifications,
    withDtstamp,
} from '@proton/shared/lib/calendar/veventHelper';
import { API_CODES } from '@proton/shared/lib/constants';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import type { Address, Api } from '@proton/shared/lib/interfaces';
import type {
    CalendarEvent,
    CalendarEventEncryptionData,
    CalendarUserSettings,
    CalendarWidgetData,
    CalendarWithOwnMembers,
    Participant,
    PmInviteData,
    SyncMultipleApiResponse,
    UpdateEventPartApiResponse,
    VcalAttendeeProperty,
    VcalDateOrDateTimeProperty,
    VcalVeventComponent,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import type {
    CreateCalendarEventSyncData,
    CreateLinkedCalendarEventsSyncData,
    CreateSinglePersonalEventData,
    DeleteCalendarEventSyncData,
    UpdateCalendarEventSyncData,
} from '@proton/shared/lib/interfaces/calendar/Api';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import type { GetCalendarInfo } from '@proton/shared/lib/interfaces/hooks/GetCalendarInfo';
import type { GetCanonicalEmailsMap } from '@proton/shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import type { RequireSome, Unwrap } from '@proton/shared/lib/interfaces/utils';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { MessageStateWithData } from '../../store/messages/messagesTypes';
import type { EventInvitation } from './invite';
import {
    UPDATE_ACTION,
    getCanCreateSingleEdit,
    getInvitationHasAttendee,
    getIsInvitationFromFuture,
    getIsInvitationOutdated,
    getIsNonSoughtEvent,
    getIsProtonInvite,
    getSingleEditWidgetData,
    processEventInvitation,
} from './invite';

const { CANCELLED } = ICAL_EVENT_STATUS;
const { NONE, KEEP_PARTSTAT, RESET_PARTSTAT, UPDATE_PARTSTAT, CANCEL } = UPDATE_ACTION;

/**
 * Get calendars and calendar user settings. If no calendar exists, create one
 */
export const getOrCreatePersonalCalendarsAndSettings = async ({
    api,
    callEventManager,
    addresses,
    isFreeUser,
    getAddressKeys,
    getCalendars,
    getCalendarUserSettings,
}: {
    api: Api;
    callEventManager: () => Promise<void>;
    addresses: Address[];
    isFreeUser: boolean;
    getAddressKeys: GetAddressKeys;
    getCalendars: () => Promise<CalendarWithOwnMembers[] | undefined>;
    getCalendarUserSettings: () => Promise<CalendarUserSettings>;
}) => {
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    let [calendarsWithOwnMembers = [], calendarUserSettings] = await Promise.all([
        getCalendars(),
        getCalendarUserSettings(),
    ]);
    let calendars = getVisualCalendars(calendarsWithOwnMembers);

    const { isCalendarsLimitReached } = getHasUserReachedCalendarsLimit(calendars, isFreeUser);

    if (!getOwnedPersonalCalendars(calendars).length && !isCalendarsLimitReached) {
        // create a calendar automatically
        try {
            const { calendar, updatedCalendarUserSettings } = await setupCalendarHelper({
                api: silentApi,
                addresses,
                getAddressKeys,
            });
            // refresh list of calendars without awaiting
            // (the refresh is just in case another widget gets opened quickly after, so that it knows there's a new calendar)
            void callEventManager();
            calendarUserSettings = { ...calendarUserSettings, ...updatedCalendarUserSettings };
            calendars = getVisualCalendars([calendar]);
        } catch {
            // fail silently
            noop();
        }
    }
    return { calendars, calendarUserSettings };
};

const getRelevantEventsByUID = ({ api, uid, calendarIDs }: { api: Api; uid: string; calendarIDs: string[] }) => {
    // No need to search for invitations in subscribed calendars
    return getPaginatedEventsByUID({ api, uid, calendarType: CALENDAR_TYPE.PERSONAL }).then((events) =>
        events.filter(({ CalendarID }) => calendarIDs.includes(CalendarID))
    );
};

export type FetchAllEventsByUID = ({
    uid,
    legacyUid,
    calendars,
    api,
    recurrenceId,
}: {
    uid: string;
    legacyUid?: string;
    calendars: VisualCalendar[];
    recurrenceId?: VcalDateOrDateTimeProperty;
    api: Api;
}) => Promise<{
    event?: CalendarEvent;
    otherEvents: CalendarEvent[];
    parentEvent?: CalendarEvent;
    otherParentEvents?: CalendarEvent[];
    supportedRecurrenceId?: VcalDateOrDateTimeProperty;
}>;

export const fetchAllEventsByUID: FetchAllEventsByUID = async ({ uid, legacyUid, calendars, api, recurrenceId }) => {
    const timestamp = recurrenceId ? getUnixTime(propertyToUTCDate(recurrenceId)) : undefined;
    const allowedCalendarIDs = calendars.map(({ ID }) => ID);

    const promises: Promise<CalendarEvent[]>[] = (() => {
        if (!legacyUid) {
            return [getRelevantEventsByUID({ api, uid, calendarIDs: allowedCalendarIDs })];
        }
        /**
         * We might be looking for an event with a legacy hash UID. We do not know in advance,
         * so we have to fire two calls. We pick the response from the one containing a result, if any
         */
        return [
            Promise.all([
                getRelevantEventsByUID({ api, uid, calendarIDs: allowedCalendarIDs }),
                getRelevantEventsByUID({ api, uid: legacyUid, calendarIDs: allowedCalendarIDs }),
            ]).then(([result, resultLegacy]) => {
                if (result[0]) {
                    return result;
                }
                return resultLegacy;
            }),
        ];
    })();
    if (recurrenceId) {
        /**
         * Notice that due to how ICS surgery works, whenever we have a hash UID, we are guaranteed not to have a
         * recurrence id, so we don't need to fire an extra call here if a legacy UID is present
         */
        promises.unshift(
            getPaginatedEventsByUID({ api, uid, recurrenceID: timestamp, calendarType: CALENDAR_TYPE.PERSONAL }).then(
                (events) => events.filter(({ CalendarID }) => allowedCalendarIDs.includes(CalendarID))
            )
        );
    }
    const [[event, ...otherEvents] = [], [parentEvent, ...otherParentEvents] = []] = await Promise.all(promises);
    if (!parentEvent) {
        return { event, otherEvents };
    }
    /**
     * If recurrenceID is passed, but the single edit is not found, there are two possibilities:
     * * The ICS contained the wrong RECURRENCE-ID. Outlook sends a wrong one for invites to single edits of all-day events,
     *   so we have to pre-emptively try a recovery mechanism (we avoid it for Proton replies to save the extra API call)
     * * The single edit does not exist in the DB event. We return the parent in that case.
     */
    if (!event && recurrenceId) {
        let recoveredEvent;
        let otherRecoveredEvents;
        if (!getIsProtonUID(uid)) {
            try {
                const supportedRecurrenceId = getLinkedDateTimeProperty({
                    // dummy identifiers since we're doing nothing with a potential error
                    componentIdentifiers: { component: '', componentId: '', domain: '', prodId: '' },
                    property: recurrenceId,
                    linkedIsAllDay: !!parentEvent.FullDay,
                    linkedTzid: parentEvent.StartTimezone,
                });
                const supportedTimestamp = getUnixTime(propertyToUTCDate(supportedRecurrenceId));
                [recoveredEvent, ...otherRecoveredEvents] = await getPaginatedEventsByUID({
                    api,
                    uid,
                    recurrenceID: supportedTimestamp,
                    calendarType: CALENDAR_TYPE.PERSONAL,
                });
                if (recoveredEvent) {
                    return {
                        event: recoveredEvent,
                        otherEvents: otherRecoveredEvents,
                        parentEvent,
                        otherParentEvents,
                        supportedRecurrenceId,
                    };
                }
            } catch (e: any) {
                noop();
            }
        }
        return { event: parentEvent, otherEvents: otherParentEvents };
    }
    return { event, otherEvents, parentEvent, otherParentEvents };
};

type FetchEventInvitation = (args: {
    veventComponent: VcalVeventComponent;
    legacyUid?: string;
    api: Api;
    getAddressKeys: GetAddressKeys;
    getCalendarInfo: GetCalendarInfo;
    getCalendarEventRaw: GetCalendarEventRaw;
    calendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    message: MessageStateWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}) => Promise<{
    invitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitation?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarData?: CalendarWidgetData;
    calendarEvent?: CalendarEvent;
    singleEditData?: CalendarEvent[];
    reencryptionData?: Required<Pick<CalendarEventEncryptionData, 'encryptingAddressID' | 'sharedSessionKey'>>;
    hasDecryptionError?: boolean;
}>;
export const fetchEventInvitation: FetchEventInvitation = async ({
    veventComponent,
    legacyUid,
    api,
    getAddressKeys,
    getCalendarInfo,
    getCalendarEventRaw,
    calendars,
    defaultCalendar,
    message,
    contactEmails,
    ownAddresses,
}) => {
    const allEventsWithUID = await fetchAllEventsByUID({
        uid: veventComponent.uid.value,
        legacyUid,
        recurrenceId: veventComponent['recurrence-id'],
        api,
        calendars,
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
            [calendarEvent, calendarParentEvent].filter(isTruthy).map((event) => getCalendarEventRaw(event))
        );
        const [
            {
                veventComponent: vevent,
                encryptionData: { sharedSessionKey, encryptingAddressID },
            },
            parentVeventResult,
        ] = veventResults;
        const result: Unwrap<ReturnType<FetchEventInvitation>> = {
            calendarData,
            calendarEvent,
            singleEditData,
        };
        if (supportedRecurrenceId) {
            vevent['recurrence-id'] = supportedRecurrenceId;
        }
        const { invitation } = processEventInvitation({ vevent, calendarEvent }, message, contactEmails, ownAddresses);
        result.invitation = invitation;
        if (parentVeventResult && calendarParentEvent) {
            const { invitation: parentInvitation } = processEventInvitation(
                { vevent: parentVeventResult.veventComponent, calendarEvent: calendarParentEvent },
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
        return { calendarData, hasDecryptionError: naiveGetIsDecryptionError(e), calendarEvent };
    }
};

interface UpdateEventArgs {
    calendarEvent: CalendarEvent;
    vevent: VcalVeventComponent;
    api: Api;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
    calendarData: Required<CalendarWidgetData>;
    hasDefaultNotifications: boolean;
    createSingleEdit?: boolean;
    updateTime?: number;
    updatePartstat?: ICAL_ATTENDEE_STATUS;
    attendee?: Participant;
    deleteIds?: string[];
    overwrite: boolean;
    pmData?: PmInviteData;
}
const updateEventApi = async ({
    calendarEvent,
    vevent,
    api,
    getCanonicalEmailsMap,
    calendarData,
    hasDefaultNotifications,
    createSingleEdit = false,
    updateTime,
    updatePartstat,
    attendee,
    overwrite,
    deleteIds = [],
    pmData,
}: UpdateEventArgs) => {
    const {
        calendar: { ID: calendarID },
        memberID,
        addressKeys,
        calendarKeys,
    } = calendarData;
    // organizer mode
    if (updateTime !== undefined && updatePartstat) {
        const { ID: eventID, AttendeesInfo } = calendarEvent;
        const token = attendee?.token;
        const attendeeID = AttendeesInfo.Attendees.find(({ Token }) => Token === token)?.ID;
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
        decryptedSharedKeyPacket: pmData?.sharedSessionKey,
    });
    const data = await createCalendarEvent({
        eventComponent: veventWithPmAttendees,
        isCreateEvent: !!createSingleEdit,
        isSwitchCalendar: false,
        hasDefaultNotifications,
        isAttendee: true,
        ...creationKeys,
    });
    if (createSingleEdit) {
        if (!getHasSharedKeyPacket(data) || !getHasSharedEventContent(data)) {
            throw new Error('Missing shared data');
        }
        const veventSharedEventID = getPmSharedEventID(vevent);
        const Events: (CreateCalendarEventSyncData | CreateLinkedCalendarEventsSyncData)[] = !!veventSharedEventID
            ? [
                  {
                      Overwrite: overwrite ? 1 : 0,
                      Event: {
                          Permissions: 1,
                          IsOrganizer: 0,
                          SharedEventID: veventSharedEventID,
                          UID: vevent.uid.value,
                          ...omit(data, ['SharedEventContent', 'AttendeesEventContent']),
                      },
                  },
              ]
            : [{ Event: { Permissions: 1, IsOrganizer: 0, ...data }, Overwrite: overwrite ? 1 : 0 }];
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
    singleEditData?: CalendarEvent[];
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
                throw new EventInvitationError(INVITATION_ERROR_TYPE.UPDATING_ERROR);
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
                    hasDefaultNotifications: getHasDefaultNotifications(calendarEvent),
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
                throw new EventInvitationError(INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
        }

        return { action: NONE };
    }
    // attendee mode
    if (method === ICAL_METHOD.REQUEST) {
        if (!veventApi) {
            return { action: NONE };
        }
        const createSingleEdit = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(veventApi);
        // If veventIcs is a singleEdit and veventApi the parent, always reset the partstat.
        // TODO: compare veventIcs with the corresponding occurrence of veventApi
        let action = createSingleEdit ? RESET_PARTSTAT : NONE;

        if (!createSingleEdit) {
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
            action = hasBreakingChange ? RESET_PARTSTAT : hasNonBreakingChange ? KEEP_PARTSTAT : NONE;
        }

        if ([KEEP_PARTSTAT, RESET_PARTSTAT].includes(action)) {
            // update the api event by the ics one with the appropriate answer
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
                const { vevent: updatedVevent, hasDefaultNotifications } = getInvitedVeventWithAlarms({
                    vevent: veventIcsWithApiAlarms,
                    oldHasDefaultNotifications: getHasDefaultNotifications(calendarEvent),
                    partstat: partstatIcs,
                    calendarSettings: calendarData.calendarSettings,
                    oldPartstat: partstatApi,
                });
                // save attendee answer
                const vcalAttendeeToSave = {
                    ...attendeeApi.vcalComponent,
                    parameters: {
                        ...attendeeApi.vcalComponent.parameters,
                        partstat: partstatIcs,
                    },
                };

                if (pmData) {
                    // we just need to send the new attendee to the API
                    updatedVevent.attendee = [vcalAttendeeToSave];
                }
                const updatedPmVevent = await withPmAttendees(withDtstamp(updatedVevent), getCanonicalEmailsMap, true);
                const updatedCalendarEvent = await updateEventApi({
                    calendarEvent,
                    vevent: updatedPmVevent,
                    hasDefaultNotifications,
                    calendarData,
                    createSingleEdit,
                    deleteIds: singleEditData?.map(({ ID }) => ID),
                    api,
                    getCanonicalEmailsMap,
                    overwrite,
                    pmData,
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
                throw new EventInvitationError(INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
        }
        return { action };
    }
    if (method === ICAL_METHOD.CANCEL) {
        let cancel = false;
        if (veventApi) {
            if (getIsVeventCancelled(veventApi)) {
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
                const { vevent, hasDefaultNotifications } = getInvitedVeventWithAlarms({
                    vevent: updatedVevent,
                    partstat: ICAL_ATTENDEE_STATUS.DECLINED,
                });
                await updateEventApi({
                    calendarEvent,
                    hasDefaultNotifications,
                    vevent,
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
                throw new EventInvitationError(INVITATION_ERROR_TYPE.CANCELLATION_ERROR);
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
    return api<SyncMultipleApiResponse>(
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
    const { vevent: veventToSave, hasDefaultNotifications } = getInvitedVeventWithAlarms({
        vevent,
        partstat,
        calendarSettings,
    });
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
        hasDefaultNotifications,
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
    singleEditData?: CalendarEvent[];
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
    const { ID: eventID, AttendeesInfo } = calendarEvent;
    const isSingleEdit = getHasRecurrenceId(veventIcs);
    const attendeeID = AttendeesInfo.Attendees.find(({ Token }) => Token === attendeeToken)?.ID;
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
                ({ eventID, calendarID, color }) =>
                    () =>
                        api<UpdateEventPartApiResponse>({
                            ...updatePersonalEventPart(calendarID, eventID, {
                                Notifications: [],
                                Color: color ? color : null,
                            }),
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
    const { vevent: veventToSave, hasDefaultNotifications } = getInvitedVeventWithAlarms({
        vevent: updatedVevent,
        partstat,
        calendarSettings,
        oldPartstat,
    });
    try {
        const payload: CreateSinglePersonalEventData = {
            Notifications: hasDefaultNotifications ? null : toApiNotifications(veventToSave.components),
            Color: veventToSave.color?.value ? veventToSave.color.value : null,
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
