import { ReactNode, createContext, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useCalendarModelEventManager } from '@proton/components/containers';
import { useApi, useEventManager, useGetCalendarEventRaw, useUser } from '@proton/components/hooks';
import { defaultESContext, useEncryptedSearch } from '@proton/encrypted-search';
import { CalendarEventManager, CalendarEventsEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';

import { getESHelpers } from '../helpers/encryptedSearch/encryptedSearchCalendarHelpers';
import { processCalendarEvents, processCoreEvents } from '../helpers/encryptedSearch/esUtils';
import {
    ESCalendarMetadata,
    ESCalendarSearchParams,
    EncryptedSearchFunctionsCalendar,
} from '../interfaces/encryptedSearch';

const EncryptedSearchContext = createContext<EncryptedSearchFunctionsCalendar>(defaultESContext);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
    calendarIDs: string[];
}

const EncryptedSearchProvider = ({ calendarIDs, children }: Props) => {
    const api = useApi();
    const history = useHistory();
    const [{ ID: userID }] = useUser();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const { subscribe: coreSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    const esHelpers = getESHelpers({ api, calendarIDs, history, userID, getCalendarEventRaw });

    const successMessage = c('Success').t`Calendar search activated`;

    const esLibraryFunctions = useEncryptedSearch<ESCalendarMetadata, ESCalendarSearchParams>({
        refreshMask: 1,
        esHelpers,
        successMessage,
    });

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
                // TODO: Also the "More" parameter should be taken into account to fetch more events
                const esEvent = await processCoreEvents(userID, Calendars, Refresh, EventID, api, getCalendarEventRaw);
                return esLibraryFunctions.handleEvent(esEvent);
            }
        );
    }, []);

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
                // TODO: Also the "More" parameter should be taken into account to fetch more events
                const esEvent = await processCalendarEvents(
                    CalendarEvents,
                    Refresh,
                    userID,
                    CalendarModelEventID,
                    api,
                    getCalendarEventRaw
                );
                return esLibraryFunctions.handleEvent(esEvent);
            }
        );
    }, [calendarIDs]);

    useEffect(() => {
        void esLibraryFunctions.initializeES();
    }, []);

    return <EncryptedSearchContext.Provider value={esLibraryFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;
