import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { DAY, MINUTE } from '@proton/shared/lib/constants';
import { addMilliseconds } from '@proton/shared/lib/date-fns-utc';
import type { Calendar as tsCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import type { CalendarsAlarmsCache } from './CacheInterface';
import getCalendarsAlarmsCached from './getCalendarsAlarmsCached';

const PADDING = 2 * MINUTE;

export const getCalendarsAlarmsCache = ({
    start = new Date(2000, 1, 1),
    end = new Date(2000, 1, 1),
} = {}): CalendarsAlarmsCache => ({
    calendarsCache: {},
    start,
    end,
});

const useCalendarsAlarms = (
    calendars: tsCalendar[],
    cacheRef: MutableRefObject<CalendarsAlarmsCache>,
    lookAhead = 2 * DAY
) => {
    const api = useApi();
    const [forceRefresh, setForceRefresh] = useState<any>();

    const calendarIDs = useMemo(() => calendars.map(({ ID }) => ID), [calendars]);

    useEffect(() => {
        let timeoutHandle = 0;
        let unmounted = false;

        const update = async () => {
            const now = new Date();

            // Cache is invalid
            if (+cacheRef.current.end - PADDING <= +now) {
                cacheRef.current = getCalendarsAlarmsCache({
                    start: now,
                    end: addMilliseconds(now, lookAhead),
                });
                cacheRef.current.rerender = () => setForceRefresh({});
            }

            const promise = getCalendarsAlarmsCached(getSilentApi(api), cacheRef.current.calendarsCache, calendarIDs, [
                cacheRef.current.start,
                cacheRef.current.end,
            ]);
            cacheRef.current.promise = promise;

            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            await promise;

            // If it's not the latest, ignore
            if (unmounted || promise !== cacheRef.current.promise) {
                return;
            }

            const delay = Math.max(0, +cacheRef.current.end - PADDING - Date.now());

            timeoutHandle = window.setTimeout(() => {
                update().catch(noop);
            }, delay);

            setForceRefresh({});
        };

        update().catch(noop);

        cacheRef.current.rerender = () => setForceRefresh({});
        return () => {
            cacheRef.current.rerender = undefined;
            unmounted = true;
            clearTimeout(timeoutHandle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-168322
    }, [calendarIDs]);

    return useMemo(() => {
        const { calendarsCache } = cacheRef.current;
        return calendarIDs
            .map((calendarID) => {
                return calendarsCache[calendarID]?.result ?? [];
            })
            .flat()
            .sort((a, b) => {
                return a.Occurrence - b.Occurrence;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CBF807
    }, [forceRefresh, calendarIDs]);
};

export default useCalendarsAlarms;
