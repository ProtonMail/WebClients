import { MORE_BITS } from './constants';
import { useMemo } from 'react';
import { getEvent } from './DayGrid';

const useMore = (moreDateIdx, eventsPerRows, events) => {
    return useMemo(() => {
        if (typeof moreDateIdx === 'undefined') {
            return [];
        }

        const moreRow = moreDateIdx & MORE_BITS;
        const moreIdx = moreDateIdx >> MORE_BITS;

        if (!eventsPerRows[moreRow]) {
            return [];
        }

        const { eventsInRowSummary, eventsInRow } = eventsPerRows[moreRow];
        if (!eventsInRowSummary[moreIdx]) {
            return [];
        }

        const moreData = eventsInRowSummary[moreIdx].events.map((i) => {
            return getEvent(i, eventsInRow, events);
        });
        return [moreData, moreRow, moreIdx];
    }, [moreDateIdx, eventsPerRows, events]);
};

export default useMore;
