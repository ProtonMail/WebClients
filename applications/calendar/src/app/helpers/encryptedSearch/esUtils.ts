import type { Location } from 'history';

import type { CachedItem, ESEvent, ESItemEvent, EncryptedItemWithInfo, EventsObject } from '@proton/encrypted-search';
import {
    ES_MAX_CONCURRENT,
    ES_MAX_ITEMS_PER_BATCH,
    ES_SYNC_ACTIONS,
    apiHelper,
    decryptFromDB,
    normalizeKeyword,
    readAllLastEvents,
    readMetadataBatch,
    readMetadataItem,
    readSortedIDs,
} from '@proton/encrypted-search';
import type { ESCalendarSearchParams } from '@proton/encrypted-search/lib/models/calendar';
import { getEvent, queryEventsIDs, queryLatestModelEventID } from '@proton/shared/lib/api/calendars';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { getHashCode } from '@proton/shared/lib/helpers/string';
import { getSearchParams as getSearchParamsFromURL, stringifySearchParams } from '@proton/shared/lib/helpers/url';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import type { Api, SimpleMap } from '@proton/shared/lib/interfaces';
import type {
    CalendarEvent,
    CalendarEventWithoutBlob,
    CalendarEventsIDsQuery,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
} from '@proton/shared/lib/interfaces/calendar';
import type {
    CalendarEventManager,
    CalendarEventsEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import unique from '@proton/utils/unique';

import { propertiesToAttendeeModel } from '../../components/eventModal/eventForm/propertiesToAttendeeModel';
import { propertiesToOrganizerModel } from '../../components/eventModal/eventForm/propertiesToOrganizerModel';
import type { CalendarSearchQuery } from '../../containers/calendar/interface';
import type {
    ESAttendeeModel,
    ESCalendarContent,
    ESCalendarMetadata,
    ESOrganizerModel,
} from '../../interfaces/encryptedSearch';
import { generateEventUniqueId, getCalendarIDFromUniqueId, getEventIDFromUniqueId } from '../event';
import { CALENDAR_CORE_LOOP } from './constants';

export const getEventKey = (calendarID: string, uid: string) => `${calendarID}-${uid}`;

/**
 * Generate a deterministic numeric value based on the input
 */
export const generateOrder = (ID: string) => getHashCode(ID);

const checkIsSearch = (searchParams: ESCalendarSearchParams) =>
    !!searchParams.calendarID || !!searchParams.begin || !!searchParams.end || !!searchParams.keyword;

const stringToInt = (string: string | undefined): number | undefined => {
    if (string === undefined) {
        return undefined;
    }
    return isNumber(string) ? parseInt(string, 10) : undefined;
};

export const generatePathnameWithSearchParams = (location: Location, searchQuery: CalendarSearchQuery) => {
    const parts = location.pathname.split('/');
    parts[1] = 'search';

    const pathname = parts.join('/');
    const hash = stringifySearchParams(searchQuery as { [key: string]: string }, '#');

    return pathname + hash;
};

export const extractSearchParameters = (location: Location): ESCalendarSearchParams => {
    const { calendarID, keyword, begin, end, page } = getSearchParamsFromURL(location.hash);

    return {
        calendarID,
        page: stringToInt(page),
        keyword: keyword ?? undefined,
        begin: stringToInt(begin),
        end: stringToInt(end),
    };
};

export const parseSearchParams = (location: Location) => {
    const searchParameters = extractSearchParameters(location);
    const isSearch = checkIsSearch(searchParameters);

    return {
        isSearch,
        esSearchParams: {
            ...searchParameters,
            ...(isSearch && searchParameters?.keyword
                ? { normalizedKeywords: normalizeKeyword(searchParameters.keyword) }
                : undefined),
        },
    };
};

export const transformOrganizer = (organizer: ESOrganizerModel) => [
    organizer.email.toLocaleLowerCase(),
    organizer.cn.toLocaleLowerCase(),
];

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

export const extractOrganizer = (organizerProperty?: VcalOrganizerProperty): ESOrganizerModel => {
    const { email = '', cn = '' } = propertiesToOrganizerModel(organizerProperty) || {};
    return { email, cn };
};

export const extractAttendees = (attendeeProperty: VcalAttendeeProperty[]): ESAttendeeModel[] => {
    const attendees = propertiesToAttendeeModel(attendeeProperty);
    return attendees.map(({ email, cn, role, partstat }) => ({ email, cn, role, partstat }));
};

export const getESEvent = async (
    eventID: string,
    calendarID: string,
    api: Api,
    getCalendarEventRaw: GetCalendarEventRaw,
    signal?: AbortSignal
): Promise<ESCalendarMetadata> => {
    const response = await apiHelper<{ Event: CalendarEvent }>({
        api,
        signal,
        options: getEvent(calendarID, eventID),
        callingContext: 'queryEventMetadata',
    });

    if (!response?.Event) {
        throw new Error('Could not fetch event metadata');
    }

    const { Event } = response;

    let hasError = false;
    const { veventComponent } = await getCalendarEventRaw(Event).catch((error) => {
        console.error('cannot decrypt event: ', error);
        hasError = true;
        return {
            veventComponent: {
                status: undefined,
                summary: undefined,
                location: undefined,
                description: undefined,
                organizer: undefined,
                attendee: [],
            },
        };
    });

    return {
        Status: veventComponent.status?.value || '',
        Summary: veventComponent.summary?.value || '',
        Location: veventComponent.location?.value || '',
        Description: veventComponent.description?.value || '',
        Attendees: veventComponent.attendee ?? [],
        Organizer: veventComponent.organizer,
        Order: await generateOrder(generateEventUniqueId(calendarID, eventID)),
        ID: Event.ID,
        SharedEventID: Event.SharedEventID,
        CalendarID: Event.CalendarID,
        CreateTime: Event.CreateTime,
        ModifyTime: Event.ModifyTime,
        Permissions: Event.Permissions,
        IsOrganizer: Event.IsOrganizer,
        IsProtonProtonInvite: Event.IsProtonProtonInvite,
        IsPersonalSingleEdit: Event.IsPersonalSingleEdit,
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
        IsDecryptable: !hasError,
        Color: Event.Color,
    };
};

export const getAllESEventsFromCalendar = async (
    calendarID: string,
    api: Api,
    getCalendarEventRaw: GetCalendarEventRaw
) => {
    const eventIDs = await getAllEventsIDs(calendarID, api, 1000);
    return runInQueue(
        eventIDs.map((eventID) => () => getESEvent(eventID, calendarID, api, getCalendarEventRaw)),
        ES_MAX_CONCURRENT
    );
};

/**
 * Fetches a batch of events from a calendar
 *
 * @returns if calendar has still more events after cursor + limit, then it will be return last fetched event as new cursor
 */
export const getESEventsFromCalendarInBatch = async ({
    calendarID,
    limit,
    eventCursor,
    api,
    getCalendarEventRaw,
}: {
    calendarID: string;
    limit: number;
    eventCursor?: string;
    api: Api;
    getCalendarEventRaw: GetCalendarEventRaw;
}) => {
    const params: CalendarEventsIDsQuery = {
        Limit: limit,
        AfterID: eventCursor,
    };

    const { IDs: eventIDs } = await api<{ IDs: string[] }>(queryEventsIDs(calendarID, params));
    const cursor = eventIDs.length === limit ? eventIDs[eventIDs.length - 1] : undefined;

    const events = await runInQueue(
        eventIDs.map((eventID) => () => getESEvent(eventID, calendarID, api, getCalendarEventRaw)),
        ES_MAX_CONCURRENT
    );

    return {
        events,
        cursor,
    };
};

const pushToRecurrenceIDsMap = (map: SimpleMap<number[]>, calendarID: string, UID: string, recurrenceID: number) => {
    const key = getEventKey(calendarID, UID);
    const entry = map[key];
    map[key] = entry ? [...entry, recurrenceID] : [recurrenceID];
};

const getItemMetadataFromEventID = async (eventID: string, userID: string, itemIDs: string[], indexKey: CryptoKey) => {
    const itemID = itemIDs.find((itemID) => getEventIDFromUniqueId(itemID) === eventID);
    if (!itemID) {
        return;
    }
    return readMetadataItem<ESCalendarMetadata>(userID, itemID, indexKey);
};

const handleCreateRecurrenceIDInMap = (map: SimpleMap<number[]>, event: CalendarEventWithoutBlob) => {
    const { CalendarID, UID, RecurrenceID } = event;
    if (!RecurrenceID) {
        return;
    }
    pushToRecurrenceIDsMap(map, CalendarID, UID, RecurrenceID);
};

const handleDeleteRecurrenceIDInMap = async (
    map: SimpleMap<number[]>,
    eventID: string,
    userID: string,
    itemIDs: string[],
    indexKey: CryptoKey
) => {
    const metadata = await getItemMetadataFromEventID(eventID, userID, itemIDs, indexKey);
    if (!metadata?.RecurrenceID) {
        return;
    }
    pushToRecurrenceIDsMap(map, metadata.CalendarID, metadata.UID, metadata.RecurrenceID);
};

/**
 * Builds a global map of recurrence ids
 */
export const buildRecurrenceIDsMap = (cache: Map<string, CachedItem<ESCalendarMetadata, ESCalendarContent>>) => {
    const result: SimpleMap<number[]> = {};
    const iterator = cache.values();
    let iteration = iterator.next();

    while (!iteration.done) {
        const {
            metadata: { CalendarID, UID, RecurrenceID },
        } = iteration.value;
        iteration = iterator.next();
        if (!RecurrenceID) {
            continue;
        }
        pushToRecurrenceIDsMap(result, CalendarID, UID, RecurrenceID);
    }

    return result;
};

export const updateRecurrenceIDsMap = async (
    userID: string,
    indexKey: CryptoKey,
    events: CalendarEventsEventManager[],
    updateMap: (setter: (map: SimpleMap<number[]>) => SimpleMap<number[]>) => void
) => {
    const additions: SimpleMap<number[]> = {};
    const deletions: SimpleMap<number[]> = {};

    const itemIDs: string[] = [];
    if (events.some(({ Action }) => [EVENT_ACTIONS.DELETE, EVENT_ACTIONS.UPDATE].includes(Action))) {
        itemIDs.push(...((await readSortedIDs(userID, false)) || []));
    }

    await Promise.all(
        events.map(async (event) => {
            if (event.Action === EVENT_ACTIONS.DELETE) {
                void handleDeleteRecurrenceIDInMap(deletions, event.ID, userID, itemIDs, indexKey);
            } else if (event.Action === EVENT_ACTIONS.CREATE) {
                handleCreateRecurrenceIDInMap(additions, event.Event);
            } else if (event.Action === EVENT_ACTIONS.UPDATE) {
                handleCreateRecurrenceIDInMap(additions, event.Event);
                void handleDeleteRecurrenceIDInMap(deletions, event.ID, userID, itemIDs, indexKey);
            }
        })
    );

    updateMap((map: SimpleMap<number[]>) => {
        const result: SimpleMap<number[]> = { ...map };
        Object.entries(additions).forEach(([UID, recurrenceIDs]) => {
            const value = unique([...(result[UID] || []), ...(recurrenceIDs || [])]);
            result[UID] = value.length ? value : undefined;
        });
        Object.entries(deletions).forEach(([UID, recurrenceIDs]) => {
            result[UID] = result[UID]?.filter((recurrenceID) => !recurrenceIDs?.includes(recurrenceID));
        });

        return result;
    });
};

/**
 * Returns all the elements stored in the IDB and flagged as not decryptable
 */
export const searchUndecryptedElements = async (
    userID: string,
    indexKey: CryptoKey,
    abortSearchingRef?: React.MutableRefObject<AbortController>
): Promise<ESCalendarMetadata[]> => {
    const results: ESCalendarMetadata[] = [];

    let remainingIDs = await readSortedIDs(userID, false);

    if (!remainingIDs?.length) {
        return results;
    }

    while (remainingIDs.length) {
        const IDs = remainingIDs.slice(0, ES_MAX_ITEMS_PER_BATCH);
        remainingIDs = remainingIDs?.slice(ES_MAX_ITEMS_PER_BATCH);

        const metadatas = await readMetadataBatch(userID, IDs);
        if (!metadatas || abortSearchingRef?.current.signal.aborted) {
            return results;
        }

        const plaintextMetadatas: ESCalendarMetadata[] = await Promise.all(
            metadatas
                .filter((item): item is EncryptedItemWithInfo => !!item)
                .map(async (encryptedMetadata) => {
                    const plaintextMetadata = await decryptFromDB<ESCalendarMetadata>({
                        aesGcmCiphertext: encryptedMetadata.aesGcmCiphertext,
                        indexKey,
                        source: 'searchUndecryptedElements',
                    });

                    return plaintextMetadata;
                })
        );

        const undecryptedMetadatas = plaintextMetadatas.filter((item) => !item.IsDecryptable);

        results.push(...undecryptedMetadatas);
    }

    return results;
};

export const processCoreEvents = async ({
    userID,
    Calendars,
    Refresh,
    EventID,
    api,
    getCalendarEventRaw,
}: {
    userID: string;
    Calendars: CalendarEventManager[];
    Refresh: number;
    EventID: string;
    api: Api;
    getCalendarEventRaw: GetCalendarEventRaw;
}): Promise<ESEvent<ESCalendarMetadata> | undefined> => {
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

            const maybeEventsFromCalendar = (await getAllESEventsFromCalendar(ID, api, getCalendarEventRaw))
                .filter((item): item is ESCalendarMetadata => !!item)
                .map((item) => ({
                    ID: generateEventUniqueId(item.CalendarID, item.ID),
                    Action: ES_SYNC_ACTIONS.CREATE,
                    ItemMetadata: item,
                }));

            Items.push(...maybeEventsFromCalendar);
        } else if (Action === EVENT_ACTIONS.DELETE) {
            // Get from IDB all items such that itemID={calendarID}.* and delete them, plus+ remove calendarID from event object
            eventLoopsToDelete.push(ID);
            const itemIDs = (await readSortedIDs(userID, false)) || [];
            Items.push(
                ...itemIDs
                    .filter((itemID) => getCalendarIDFromUniqueId(itemID) === ID)
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
            const itemID = itemIDs.find((itemID) => getEventIDFromUniqueId(itemID) === ID);
            if (itemID) {
                calendarID = getCalendarIDFromUniqueId(itemID);
                Items.push({ ID: itemID, Action: ES_SYNC_ACTIONS.DELETE, ItemMetadata: undefined });
            }
        } else {
            // In case of update or create events, instead, we have the calendar ID in the event
            const { CalendarID } = CalendarEvent.Event;
            calendarID = CalendarID;
            const esAction = EVENT_ACTIONS.UPDATE ? ES_SYNC_ACTIONS.UPDATE_METADATA : ES_SYNC_ACTIONS.CREATE;
            const esItem = await getESEvent(ID, CalendarID, api, getCalendarEventRaw);
            if (esItem) {
                Items.push({ ID: generateEventUniqueId(CalendarID, ID), Action: esAction, ItemMetadata: esItem });
            }
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
