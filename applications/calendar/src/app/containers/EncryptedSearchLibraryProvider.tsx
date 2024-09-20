import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useContactEmailsCache } from '@proton/components';
import { useCalendarModelEventManager } from '@proton/components/containers/eventManager';
import { useApi, useEventManager, useGetCalendarEventRaw, useUser } from '@proton/components/hooks';
import type { IndexingMetrics } from '@proton/encrypted-search';
import { defaultESContext, useEncryptedSearch } from '@proton/encrypted-search';
import { TelemetryCalendarEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { MINUTE_IN_SECONDS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type {
    CalendarEventManager,
    CalendarEventsEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';

import { getESCallbacks } from '../helpers/encryptedSearch/calendarESCallbacks';
import {
    buildRecurrenceIDsMap,
    processCalendarEvents,
    processCoreEvents,
    updateRecurrenceIDsMap,
} from '../helpers/encryptedSearch/esUtils';
import type {
    ESCalendarContent,
    ESCalendarMetadata,
    ESCalendarSearchParams,
    EncryptedSearchFunctionsCalendar,
} from '../interfaces/encryptedSearch';

interface EncryptedSearchLibrary extends EncryptedSearchFunctionsCalendar {
    isLibraryInitialized: boolean;
    recurrenceIDsMap: SimpleMap<number[]>;
}

const EncryptedSearchLibraryContext = createContext<EncryptedSearchLibrary>({
    ...defaultESContext,
    isLibraryInitialized: false,
    recurrenceIDsMap: {},
});

export const useEncryptedSearchLibrary = () => useContext(EncryptedSearchLibraryContext);

interface Props {
    calendarIDs: string[];
    children?: ReactNode;
    hasReactivatedCalendarsRef: React.MutableRefObject<boolean>;
}

const EncryptedSearchLibraryProvider = ({ calendarIDs, hasReactivatedCalendarsRef, children }: Props) => {
    const api = useApi();
    const history = useHistory();
    const [{ ID: userID }] = useUser();
    const { contactEmailsMap } = useContactEmailsCache();
    const getCalendarEventRaw = useGetCalendarEventRaw(contactEmailsMap);
    const { subscribe: coreSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    const [isLibraryInitialized, setIsLibraryInitialized] = useState(false);
    const [recurrenceIDsMap, setRecurrenceIDsMap] = useState<SimpleMap<number[]>>({});

    const esCallbacks = useMemo(
        () =>
            getESCallbacks({
                api,
                calendarIDs,
                history,
                userID,
                getCalendarEventRaw,
            }),
        [api, calendarIDs, history, userID, getCalendarEventRaw]
    );

    const handleIndexingMetrics = (metrics: IndexingMetrics) => {
        const { numInterruptions, numPauses, indexTime, totalItems } = metrics;
        const roundedIndexTimeInMinutes = Math.round(indexTime / MINUTE_IN_SECONDS);

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.calendarEncryptedSearch,
            event: TelemetryCalendarEvents.enable_encrypted_search,
            values: { numInterruptions, numPauses, indexTime: roundedIndexTimeInMinutes, totalItems },
        });
    };

    const esLibraryFunctions = useEncryptedSearch<ESCalendarMetadata, ESCalendarSearchParams, ESCalendarContent>({
        refreshMask: 1,
        esCallbacks,
        onMetadataIndexed: handleIndexingMetrics,
    });
    const { isConfigFromESDBLoaded, cachedIndexKey, esEnabled } = esLibraryFunctions.esStatus;

    // Core loop
    useEffect(() => {
        return coreSubscribe(
            async ({
                Calendars = [],
                Refresh = 0,
                EventID,
            }: {
                EventID: string;
                Calendars?: CalendarEventManager[];
                Refresh?: number;
            }) => {
                /**
                 * If we have `More` core events to handle, the application itself will take care of the pagination so this handler will automatically get called next.
                 */
                const esEvent = await processCoreEvents({
                    userID,
                    Calendars,
                    Refresh,
                    EventID,
                    api,
                    getCalendarEventRaw,
                });

                return esLibraryFunctions.handleEvent(esEvent);
            }
        );
    }, [esLibraryFunctions, esCallbacks, getCalendarEventRaw]);

    // Calendars loop
    useEffect(() => {
        return calendarSubscribe(
            calendarIDs,
            async ({
                CalendarEvents = [],
                Refresh = 0,
                CalendarModelEventID,
            }: {
                CalendarModelEventID: string;
                CalendarEvents?: CalendarEventsEventManager[];
                Refresh?: number;
            }) => {
                /**
                 * If we have `More` calendar events (e.g: in case of a large import) to handle, the application itself will take care of the pagination so this handler will automatically get called next.
                 */
                const esEvent = await processCalendarEvents(
                    CalendarEvents,
                    Refresh,
                    userID,
                    CalendarModelEventID,
                    api,
                    getCalendarEventRaw
                );
                if (cachedIndexKey) {
                    await updateRecurrenceIDsMap(userID, cachedIndexKey, CalendarEvents, setRecurrenceIDsMap);
                }

                return esLibraryFunctions.handleEvent(esEvent);
            }
        );
    }, [calendarIDs, esLibraryFunctions, esCallbacks, cachedIndexKey]);

    useEffect(() => {
        if (!isConfigFromESDBLoaded) {
            return;
        }

        const initializeLibrary = async () => {
            // TODO: error handling
            await esLibraryFunctions.initializeES();
            setIsLibraryInitialized(true);

            if (hasReactivatedCalendarsRef.current) {
                await esLibraryFunctions.correctDecryptionErrors();
                hasReactivatedCalendarsRef.current = false;
            }
        };

        void initializeLibrary();
    }, [isConfigFromESDBLoaded]);

    useEffect(
        () => {
            /**
             * We can't run this logic in the previous useEffect because we have to wait for React to update the
             * encrypted search state before running cacheIndexedDB.
             * The library does not offer a way to decouple internal logic from React state logic
             */
            if (!isLibraryInitialized || !esEnabled) {
                return;
            }
            const computeRecurrenceIDsMap = async () => {
                // we have to initialize the cache early to build the recurrenceIDs map, to be done in the other useEffect
                await esLibraryFunctions.cacheIndexedDB();
                setRecurrenceIDsMap(buildRecurrenceIDsMap(esLibraryFunctions.getCache()));
            };
            void computeRecurrenceIDsMap();
        },
        // getting the cache is a heavy operation; with these dependencies it should be run just once per app lifecycle
        [isLibraryInitialized, esEnabled]
    );

    const value = { ...esLibraryFunctions, isLibraryInitialized, recurrenceIDsMap };

    return <EncryptedSearchLibraryContext.Provider value={value}>{children}</EncryptedSearchLibraryContext.Provider>;
};

export default EncryptedSearchLibraryProvider;
