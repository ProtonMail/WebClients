import type { History } from 'history';

import type {
    CachedItem,
    ESCallbacks,
    ESItemInfo,
    ESStatusBooleans,
    EventsObject,
    RecordProgress,
} from '@proton/encrypted-search';
import {
    ES_MAX_CONCURRENT,
    ES_MAX_ITEMS_PER_BATCH,
    checkVersionedESDB,
    esSentryReport,
    metadataIndexingProgress,
    normalizeKeyword,
    storeItemsMetadata,
    testKeywords,
} from '@proton/encrypted-search';
import type { ESCalendarSearchParams } from '@proton/encrypted-search/lib/models/calendar';
import { getEventsCount, queryLatestModelEventID } from '@proton/shared/lib/api/calendars';
import { getLatestID } from '@proton/shared/lib/api/events';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import type { Api } from '@proton/shared/lib/interfaces';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import chunk from '@proton/utils/chunk';

import type { ESCalendarContent, ESCalendarMetadata, MetadataRecoveryPoint } from '../../interfaces/encryptedSearch';
import { generateEventUniqueId } from '../event';
import { CALENDAR_CORE_LOOP, MAX_EVENT_BATCH, MIN_EVENT_BATCH } from './constants';
import {
    extractAttendees,
    extractOrganizer,
    getESEvent,
    getESEventsFromCalendarInBatch,
    parseSearchParams,
    searchUndecryptedElements,
    transformAttendees,
    transformOrganizer,
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

    const queryItemsMetadata = async (
        signal: AbortSignal,
        isBackgroundIndexing?: boolean
    ): Promise<ItemMetadataQueryResult> => {
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

        /**
         * On calendar with a lot of events, having a pseudo-random batch size on each iteration makes the indexing look a bit more dynamic
         */
        const batchSize = Math.floor(Math.random() * (MAX_EVENT_BATCH - MIN_EVENT_BATCH + 1)) + MIN_EVENT_BATCH;

        const { events: esMetadataEvents, cursor: newCursor } = await getESEventsFromCalendarInBatch({
            calendarID: currentCalendarId,
            limit: batchSize,
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
            await setNewRecoveryPoint?.();
            return queryItemsMetadata(signal, isBackgroundIndexing);
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
        ID: generateEventUniqueId(item.CalendarID, item.ID),
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
            ...transformOrganizer(extractOrganizer(metadata?.Organizer)),
            ...transformAttendees(extractAttendees(metadata?.Attendees)),
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

    const correctDecryptionErrors = async (
        userID: string,
        indexKey: CryptoKey,
        abortIndexingRef: React.MutableRefObject<AbortController>,
        esStatus: ESStatusBooleans,
        recordProgress: RecordProgress
    ) => {
        if (esStatus.isEnablingEncryptedSearch || !esStatus.esEnabled) {
            return 0;
        }

        let correctedEventsCount = 0;
        const events = await searchUndecryptedElements(userID, indexKey, abortIndexingRef);
        void recordProgress([0, events.length], 'metadata');

        const chunks = chunk(events, ES_MAX_ITEMS_PER_BATCH);

        for (const chunk of chunks) {
            const metadatas = await runInQueue(
                chunk.map(({ ID, CalendarID }) => () => {
                    return getESEvent(ID, CalendarID, api, getCalendarEventRaw);
                }),
                ES_MAX_CONCURRENT
            );

            const decryptedMetadatas = metadatas.filter((item) => item.IsDecryptable);

            // if we reach this part of code, es is considered supported
            const esSupported = true;
            const success = await storeItemsMetadata<ESCalendarMetadata>({
                userID,
                resultMetadata: decryptedMetadatas,
                esSupported,
                indexKey,
                getItemInfo,
            }).catch((error: any) => {
                if (!(error?.message === 'Operation aborted') && !(error?.name === 'AbortError')) {
                    esSentryReport('storeItemsBatches: storeItems', { error });
                }

                return false;
            });

            if (!success) {
                break;
            }

            correctedEventsCount += decryptedMetadatas.length;
            void recordProgress(correctedEventsCount, 'metadata');
        }

        return correctedEventsCount;
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
        correctDecryptionErrors,
    };
};
