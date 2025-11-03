import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { isWithinInterval } from 'date-fns';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { getMonthDateRange } from './getMonthDateRange';
import { getNextDateRange } from './getNextDateRange';
import { getPreviousDateRange } from './getPreviousDateRange';

interface PrefetchProps {
    initialDateRange: DateTuple;
    isLoading: boolean;
    prefetchCalendarEvents: (range: DateTuple) => Promise<void>;
    tzid: string;
}

export const useEventsPrefetch = ({ initialDateRange, isLoading, prefetchCalendarEvents, tzid }: PrefetchProps) => {
    const history = useHistory();

    const [userSettings] = useUserSettings();

    const weekStartsOn = getWeekStartsOn(userSettings);

    const prefetchDateRanges = async (currentDateRange: DateTuple) => {
        const nextDateRange = getNextDateRange(currentDateRange, weekStartsOn, tzid);

        const today = new Date();
        const [start, end] = currentDateRange;
        const isTodayInRange = isWithinInterval(today, { start, end });
        // When a user presses the next or previous buttons, the ensuing history action is 'PUSH'.
        // We are not interested in performing a prefetch in these cases, as presumably the "Today"
        // date range is already cached. However, when a user loads the page initially with a path
        // indicating a date, the history action is 'POP', and if today's date isn't in the range
        // specified by the path, we want to prefetch the month that today is in so that, if the
        // user clicks on "Today", he or she won't need to wait for the events to load.
        const todayMonthDateRange =
            history.action === 'POP' && !isTodayInRange ? getMonthDateRange(today, weekStartsOn, tzid) : null;

        const previousDateRange = getPreviousDateRange(currentDateRange, weekStartsOn, tzid);

        const prefetches = [
            nextDateRange,
            ...(todayMonthDateRange ? [todayMonthDateRange] : []),
            previousDateRange,
        ].map((dateRange) => prefetchCalendarEvents(dateRange));

        await Promise.all(prefetches);
    };

    useEffect(() => {
        if (!isLoading) {
            void prefetchDateRanges(initialDateRange);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CC0134
    }, [isLoading, initialDateRange]);
};
