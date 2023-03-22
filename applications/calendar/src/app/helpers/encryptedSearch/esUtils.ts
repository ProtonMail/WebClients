import { Location } from 'history';

import { CryptoProxy } from '@proton/crypto';
import {
    ESEvent,
    ESItemEvent,
    ES_MAX_CONCURRENT,
    ES_SYNC_ACTIONS,
    EventsObject,
    normalizeKeyword,
    readAllLastEvents,
    readSortedIDs,
} from '@proton/encrypted-search';
import { getEvent, queryEventsIDs, queryLatestModelEventID } from '@proton/shared/lib/api/calendars';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { getSearchParams as getSearchParamsFromURL } from '@proton/shared/lib/helpers/url';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import { Api } from '@proton/shared/lib/interfaces';
import { CalendarEvent, CalendarEventsIDsQuery, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { CalendarEventManager, CalendarEventsEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import { propertiesToAttendeeModel } from '../../components/eventModal/eventForm/propertiesToAttendeeModel';
import { ESAttendeeModel, ESCalendarMetadata, ESCalendarSearchParams } from '../../interfaces/encryptedSearch';
import { CALENDAR_CORE_LOOP } from './constants';

export const generateID = (calendarID: string, eventID: string) => `${calendarID}.${eventID}`;
export const getCalendarIDFromItemID = (itemID: string) => itemID.split('.')[0];
export const getEventIDFromItemID = (itemID: string) => itemID.split('.')[1];

const parseHashParams = (urlHash: string) => {
    const result: Record<string, string> = {};

    return urlHash
        .slice(1)
        .split('&')
        .reduce(function (res, item) {
            const [key, value] = item.split('=');
            res[key] = value;
            return res;
        }, result);
};

export const extractSearchParametersFromURL = (location: Location) => {
    const hashParams = parseHashParams(location.hash);
    const { q } = hashParams;
    return q ? decodeURIComponent(q) : '';
};

export const generateOrder = async (ID: string) => {
    const numericalID = ID.split('').map((char) => char.charCodeAt(0));
    const digest = await CryptoProxy.computeHash({ algorithm: 'unsafeMD5', data: Uint8Array.from(numericalID) });
    const orderArray = new Uint32Array(digest.buffer);

    return orderArray[0];
};

const checkIsSearch = (searchParams: ESCalendarSearchParams) =>
    !!searchParams.calendarID || !!searchParams.begin || !!searchParams.end || !!searchParams.normalizedKeywords;

const stringToInt = (string: string | undefined): number | undefined => {
    if (string === undefined) {
        return undefined;
    }
    return isNumber(string) ? parseInt(string, 10) : undefined;
};

const extractSearchParameters = (location: Location): ESCalendarSearchParams => {
    const { calendarID, keyword, begin, end } = getSearchParamsFromURL(location.hash);
    return {
        calendarID,
        normalizedKeywords: !!keyword ? normalizeKeyword(keyword) : undefined,
        begin: stringToInt(begin),
        end: stringToInt(end),
    };
};

export const parseSearchParams = (location: Location) => {
    const searchParameters = extractSearchParameters(location);
    const isSearch = checkIsSearch(searchParameters);

    return {
        isSearch,
        esSearchParams: isSearch ? searchParameters : undefined,
    };
};

export const transformAttendees = (attendees: ESAttendeeModel[]) => [
    ...attendees.map((attendee) => attendee.email.toLocaleLowerCase()),
    ...attendees.map((attendee) => attendee.cn.toLocaleLowerCase()),
];

export const getAllEventsIDs = async (calendarID: string, api: Api, Limit: number = 100) => {
    const result: string[] = [];
    let previousLength = -1;

    const params: CalendarEventsIDsQuery = {
        Limit,
        AfterID: undefined,
    };

    while (result.length > previousLength) {
        previousLength = result.length;

        const { IDs } = await api<{ IDs: string[] }>(queryEventsIDs(calendarID, params));
        result.push(...IDs);

        params.AfterID = IDs[IDs.length - 1];
    }

    return result;
};

export const extractAttendees = (veventComponent: VcalVeventComponent): ESAttendeeModel[] => {
    const attendees = propertiesToAttendeeModel(veventComponent.attendee);
    return attendees.map(({ email, cn, role, partstat }) => ({ email, cn, role, partstat }));
};

export const getESEvent = async (
    eventID: string,
    calendarID: string,
    api: Api,
    getCalendarEventRaw: GetCalendarEventRaw
): Promise<ESCalendarMetadata> => {
    const { Event } = await api<{ Event: CalendarEvent }>(getEvent(calendarID, eventID));
    const { veventComponent } = await getCalendarEventRaw(Event);

    return {
        Summary: veventComponent.summary?.value || '',
        Location: veventComponent.location?.value || '',
        Description: veventComponent.description?.value || '',
        Attendees: extractAttendees(veventComponent),
        Order: await generateOrder(generateID(calendarID, eventID)),
        ID: Event.ID,
        SharedEventID: Event.SharedEventID,
        CalendarID: Event.CalendarID,
        CreateTime: Event.CreateTime,
        ModifyTime: Event.ModifyTime,
        Permissions: Event.Permissions,
        IsOrganizer: Event.IsOrganizer,
        IsProtonProtonInvite: Event.IsProtonProtonInvite,
        IsPersonalMigrated: Event.IsPersonalMigrated,
        Author: Event.Author,
        StartTime: Event.StartTime,
        StartTimezone: Event.StartTimezone,
        EndTime: Event.EndTime,
        EndTimezone: Event.EndTimezone,
        FullDay: Event.FullDay,
        RRule: Event.RRule,
        UID: Event.UID,
        RecurrenceID: Event.RecurrenceID,
        Exdates: Event.Exdates,
    };
};

export const getAllESEventsFromCalendar = async (
    calendarID: string,
    api: Api,
    getCalendarEventRaw: GetCalendarEventRaw
) => {
    const eventIDs = await getAllEventsIDs(calendarID, api, 1000);
    return runInQueue(
        eventIDs.map(
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            (eventID) => () => getESEvent(eventID, calendarID, api, getCalendarEventRaw)
        ),
        ES_MAX_CONCURRENT
    );
};

export const processCoreEvents = async (
    userID: string,
    Calendars: CalendarEventManager[],
    Refresh: number,
    EventID: string,
    api: Api,
    getCalendarEventRaw: GetCalendarEventRaw
): Promise<ESEvent<ESCalendarMetadata> | undefined> => {
    if (!Calendars.length && !Refresh) {
        return;
    }

    // Get all existing event loops
    const oldEventsObject = await readAllLastEvents(userID);
    if (!oldEventsObject) {
        return;
    }
    const eventLoopsToDelete = [];

    const newEventsObject: EventsObject = {};

    const Items: ESItemEvent<ESCalendarMetadata>[] = [];

    for (const { ID, Action } of Calendars) {
        if (Action === EVENT_ACTIONS.CREATE) {
            // Get events from API and add them, plus add calendarID to event object
            const { CalendarModelEventID } = await api<{ CalendarModelEventID: string }>(queryLatestModelEventID(ID));
            newEventsObject[ID] = CalendarModelEventID;

            Items.push(
                ...(await getAllESEventsFromCalendar(ID, api, getCalendarEventRaw)).map((item) => ({
                    ID: generateID(item.CalendarID, item.ID),
                    Action: ES_SYNC_ACTIONS.CREATE,
                    ItemMetadata: item,
                }))
            );
        } else if (Action === EVENT_ACTIONS.DELETE) {
            // Get from IDB all items such that itemID={calendarID}.* and delete them, plus+ remove calendarID from event object
            eventLoopsToDelete.push(ID);
            const itemIDs = (await readSortedIDs(userID, false)) || [];
            Items.push(
                ...itemIDs
                    .filter((itemID) => getCalendarIDFromItemID(itemID) === ID)
                    .map((itemID) => ({ ID: itemID, Action: ES_SYNC_ACTIONS.DELETE, ItemMetadata: undefined }))
            );
        }
    }

    for (const componentID in oldEventsObject) {
        if (!eventLoopsToDelete.includes(componentID)) {
            const lastEventID = oldEventsObject[componentID];
            newEventsObject[componentID] = lastEventID;
        }
    }
    newEventsObject[CALENDAR_CORE_LOOP] = EventID;

    return {
        Refresh,
        Items,
        eventsToStore: newEventsObject,
    };
};

export const processCalendarEvents = async (
    CalendarEvents: CalendarEventsEventManager[],
    Refresh: number,
    userID: string,
    CalendarModelEventID: string,
    api: Api,
    getCalendarEventRaw: GetCalendarEventRaw
): Promise<ESEvent<ESCalendarMetadata> | undefined> => {
    if (!CalendarEvents.length && !Refresh) {
        return;
    }

    // Get all existing event loops
    const oldEventsObject = await readAllLastEvents(userID);
    if (!oldEventsObject) {
        return;
    }
    const Items: ESItemEvent<ESCalendarMetadata>[] = [];
    const newEventsObject: EventsObject = {};

    const itemIDs = (await readSortedIDs(userID, false)) || [];

    for (const CalendarEvent of CalendarEvents) {
        const { ID, Action } = CalendarEvent;
        let calendarID: string | undefined;

        if (Action === EVENT_ACTIONS.DELETE) {
            // If it's a delete event, we should have the item already in IDB, therefore
            // we can deduce the calendar ID from it
            const itemID = itemIDs.find((itemID) => getEventIDFromItemID(itemID) === ID);
            if (itemID) {
                calendarID = getCalendarIDFromItemID(itemID);
                Items.push({ ID: itemID, Action: ES_SYNC_ACTIONS.DELETE, ItemMetadata: undefined });
            }
        } else {
            // In case of update or create events, instead, we have the calendar ID in the event
            const { CalendarID } = CalendarEvent.Event;
            calendarID = CalendarID;
            // CREATE or UPDATE is the same because we anyway overwrite the row in IDB
            const esItem = await getESEvent(ID, CalendarID, api, getCalendarEventRaw);
            Items.push({ ID: generateID(CalendarID, ID), Action: ES_SYNC_ACTIONS.CREATE, ItemMetadata: esItem });
        }

        if (calendarID) {
            newEventsObject[calendarID] = CalendarModelEventID;
        }
    }

    for (const componentID in oldEventsObject) {
        const last: string | undefined = newEventsObject[componentID];
        if (typeof last === 'undefined') {
            const lastEventID = oldEventsObject[componentID];
            newEventsObject[componentID] = lastEventID;
        }
    }

    return {
        Refresh,
        Items,
        eventsToStore: newEventsObject,
    };
};
