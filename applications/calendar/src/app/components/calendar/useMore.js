import { useMemo } from 'react';
import { MORE_BITS } from './constants';
import { getEvent } from './DayGrid/helper';

const useMore = (moreDateIdx, rows, eventsPerRows, events) => {
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

        const moreEvents = eventsInRowSummary[moreIdx].events.map((i) => {
            return getEvent(i, eventsInRow, events);
        });
        const moreDate = rows[moreRow][moreIdx];
        return [moreEvents, moreDate, moreRow, moreIdx];
    }, [moreDateIdx, eventsPerRows, events]);
};

export default useMore;
