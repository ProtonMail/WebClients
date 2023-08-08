import { History } from 'history';

import {
    CachedItem,
    ESCallbacks,
    ESItemInfo,
    EventsObject,
    checkVersionedESDB,
    metadataIndexingProgress,
    normalizeKeyword,
    testKeywords,
} from '@proton/encrypted-search';
import { getEventsCount, queryLatestModelEventID } from '@proton/shared/lib/api/calendars';
import { getLatestID } from '@proton/shared/lib/api/events';
import { Api } from '@proton/shared/lib/interfaces';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import {
    ESCalendarContent,
    ESCalendarMetadata,
    ESCalendarSearchParams,
    MetadataRecoveryPoint,
} from '../../interfaces/encryptedSearch';
import { CALENDAR_CORE_LOOP } from './constants';
import {
    extractAttendees,
    generateID,
    getESEventsFromCalendarInBatch,
    parseSearchParams,
    transformAttendees,
} from './esUtils';

interface Props {
    api: Api;
    calendarIDs: string[];
    history: History;
    userID: string;
    getCalendarEventRaw: GetCalendarEventRaw;
}

interface ItemMetadataQueryResult {
    resultMetadata?: ESCalendarMetadata[];
    setRecoveryPoint?: (setIDB?: boolean) => Promise<void>;
}

const popOneCalendar = (
    calendarIDs: string[]
): Pick<MetadataRecoveryPoint, 'remainingCalendarIDs' | 'currentCalendarId'> => {
    const [first, ...rest] = calendarIDs;

    return {
        remainingCalendarIDs: rest,
        currentCalendarId: first,
    };
};

export const getESCallbacks = ({
    api,
    calendarIDs,
    history,
    userID,
    getCalendarEventRaw,
}: Props): ESCallbacks<ESCalendarMetadata, ESCalendarSearchParams, ESCalendarContent> => {
    // We need to keep the recovery point for metadata indexing in memory
    // for cases where IDB couldn't be instantiated but we still want to
    // index content
    let metadataRecoveryPoint: MetadataRecoveryPoint | undefined;

    const queryItemsMetadata = async (): Promise<ItemMetadataQueryResult> => {
        let recoveryPoint: MetadataRecoveryPoint = metadataRecoveryPoint ?? popOneCalendar(calendarIDs);
        // Note that indexing, and therefore an instance of this function,
        // can exist even without an IDB, because we can index in memory only.
        // Therefore, we have to check if an IDB exists before querying it
        const esdbExists = await checkVersionedESDB(userID);
        if (esdbExists) {
            const localRecoveryPoint: MetadataRecoveryPoint = await metadataIndexingProgress.readRecoveryPoint(userID);
            if (localRecoveryPoint) {
                recoveryPoint = localRecoveryPoint;
            }
        }

        const { currentCalendarId } = recoveryPoint;
        if (!currentCalendarId) {
            return { resultMetadata: [] };
        }

        const { events: esMetadataEvents, cursor: newCursor } = await getESEventsFromCalendarInBatch({
            calendarID: currentCalendarId,
            eventCursor: recoveryPoint.eventCursor,
            api,
            getCalendarEventRaw,
        });

        const newRecoveryPoint: MetadataRecoveryPoint = newCursor
            ? {
                  ...recoveryPoint,
                  eventCursor: newCursor,
              }
            : popOneCalendar(recoveryPoint.remainingCalendarIDs);

        const setNewRecoveryPoint = esdbExists
            ? async (setIDB: boolean = true) => {
                  metadataRecoveryPoint = newRecoveryPoint;
                  if (setIDB) {
                      await metadataIndexingProgress.setRecoveryPoint(userID, newRecoveryPoint);
                  }
              }
            : undefined;

        // some calendars might have no event so if there is others, we want to forward query to them
        if (!esMetadataEvents.length && newRecoveryPoint.currentCalendarId) {
            console.warn('empty calendar, skipping: next one please!');
            await setNewRecoveryPoint?.();
            return queryItemsMetadata();
        }

        return {
            resultMetadata: esMetadataEvents,
            setRecoveryPoint: setNewRecoveryPoint,
        };
    };

    const getPreviousEventID = async () => {
        const eventObject: { [key: string]: string } = {};

        // Calendars previous events
        await Promise.all(
            calendarIDs.map(async (ID) => {
                const { CalendarModelEventID } = await api<{ CalendarModelEventID: string }>(
                    queryLatestModelEventID(ID)
                );
                eventObject[ID] = CalendarModelEventID;
            })
        );

        // Core previous event
        const { EventID } = await api<{ EventID: string }>(getLatestID());
        eventObject[CALENDAR_CORE_LOOP] = EventID;

        return eventObject;
    };

    const getItemInfo = (item: ESCalendarMetadata): ESItemInfo => ({
        ID: generateID(item.CalendarID, item.ID),
        timepoint: [item.CreateTime, item.Order],
    });

    const getSearchParams = () => {
        const { isSearch, esSearchParams } = parseSearchParams(history.location);
        return {
            isSearch,
            esSearchParams,
        };
    };

    const getKeywords = (esSearchParams: ESCalendarSearchParams) =>
        esSearchParams.keyword ? normalizeKeyword(esSearchParams.keyword) : [];

    const searchKeywords = (
        keywords: string[],
        itemToSearch: CachedItem<ESCalendarMetadata, ESCalendarContent>,
        hasApostrophe: boolean
    ) => {
        const { metadata } = itemToSearch;

        const stringsToSearch: string[] = [
            metadata?.Description || '',
            metadata?.Location || '',
            metadata?.Summary || '',
            ...transformAttendees(extractAttendees({ attendee: metadata?.Attendees })),
        ];

        return testKeywords(keywords, stringsToSearch, hasApostrophe);
    };

    const getTotalItems = async () => {
        const counts = await Promise.all(calendarIDs.map((ID) => api<{ Total: number }>(getEventsCount(ID))));
        return counts.reduce((p, c) => p + c.Total, 0);
    };

    const getEventFromIDB = async (previousEventsObject?: EventsObject) => ({
        newEvents: [],
        shouldRefresh: false,
        eventsToStore: previousEventsObject ?? {},
    });

    const applyFilters = (esSearchParams: ESCalendarSearchParams, metadata: ESCalendarMetadata) => {
        const { calendarID, begin, end } = esSearchParams;

        if (!metadata.IsDecryptable) {
            return false;
        }

        const { CalendarID, StartTime, EndTime, RRule } = metadata;

        // If it's the wrong calendar, we exclude it
        if (calendarID && calendarID !== CalendarID) {
            return false;
        }

        // If it's recurrent, we don't immediately check the timings since that will
        // be done upon displaying the search results
        if (typeof RRule === 'string') {
            return true;
        }

        // Check it's within time window selected by the user
        if ((begin && EndTime < begin) || (end && StartTime > end)) {
            return false;
        }

        return true;
    };

    return {
        queryItemsMetadata,
        getPreviousEventID,
        getItemInfo,
        getSearchParams,
        getKeywords,
        searchKeywords,
        getTotalItems,
        getEventFromIDB,
        applyFilters,
    };
};
