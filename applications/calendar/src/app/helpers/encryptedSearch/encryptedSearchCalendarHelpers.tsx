import { History } from 'history';

import {
    CachedItem,
    ESHelpers,
    ESItemInfo,
    EventsObject,
    checkVersionedESDB,
    readMetadataRecoveryPoint,
    setMetadataRecoveryPoint,
    testKeywords,
} from '@proton/encrypted-search';
import { getEventsCount, queryLatestModelEventID } from '@proton/shared/lib/api/calendars';
import { getLatestID } from '@proton/shared/lib/api/events';
import { Api } from '@proton/shared/lib/interfaces';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import { ESCalendarMetadata, ESCalendarSearchParams, MetadataRecoveryPoint } from '../../interfaces/encryptedSearch';
import { CALENDAR_CORE_LOOP } from './constants';
import { generateID, getAllESEventsFromCalendar, parseSearchParams, transformAttendees } from './esUtils';

interface Props {
    api: Api;
    calendarIDs: string[];
    history: History;
    userID: string;
    getCalendarEventRaw: GetCalendarEventRaw;
}

export const getESHelpers = ({
    api,
    calendarIDs,
    history,
    userID,
    getCalendarEventRaw,
}: Props): ESHelpers<ESCalendarMetadata, ESCalendarSearchParams> => {
    // We need to keep the recovery point for metadata indexing in memory
    // for cases where IDB couldn't be instantiated but we still want to
    // index content
    let metadataRecoveryPoint: MetadataRecoveryPoint | undefined;
    const queryItemsMetadata = async (): Promise<{
        resultMetadata?: ESCalendarMetadata[];
        setRecoveryPoint?: (setIDB?: boolean) => Promise<void>;
    }> => {
        const recoveryPoint: MetadataRecoveryPoint = metadataRecoveryPoint || [];
        // Note that indexing, and therefore an instance of this function,
        // can exist even without an IDB, because we can index in memory only.
        // Therefore, we have to check if an IDB exists before querying it
        const esdbExists = await checkVersionedESDB(userID);
        if (esdbExists) {
            const localRecoveryPoint: MetadataRecoveryPoint = (await readMetadataRecoveryPoint(userID)) || [];
            recoveryPoint.push(...localRecoveryPoint);
        }

        if (calendarIDs.length === 0) {
            return { resultMetadata: [] };
        }

        const nextCalendarID = calendarIDs.find((calendarID) => !recoveryPoint.includes(calendarID));
        if (!nextCalendarID) {
            return { resultMetadata: [] };
        }

        const esMetadataEvents = await getAllESEventsFromCalendar(nextCalendarID, api, getCalendarEventRaw);

        const newRecoveryPoint = [...recoveryPoint, nextCalendarID];

        return {
            resultMetadata: esMetadataEvents,
            setRecoveryPoint: esdbExists
                ? async (setIDB: boolean = true) => {
                      metadataRecoveryPoint = newRecoveryPoint;
                      if (setIDB) {
                          await setMetadataRecoveryPoint(userID, newRecoveryPoint);
                      }
                  }
                : undefined,
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

    const getKeywords = (esSearchParams: ESCalendarSearchParams) => esSearchParams.normalizedKeywords;

    const searchKeywords = (
        keywords: string[],
        itemToSearch: CachedItem<ESCalendarMetadata, void>,
        hasApostrophe: boolean
    ) => {
        const stringsToSearch: string[] = [
            itemToSearch.metadata?.Description || '',
            itemToSearch.metadata?.Location || '',
            itemToSearch.metadata?.Summary || '',
            ...transformAttendees(itemToSearch.metadata?.Attendees || []),
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
        const { CalendarID, StartTime, EndTime, RRule } = metadata;
        const { calendarID, begin, end } = esSearchParams;

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
