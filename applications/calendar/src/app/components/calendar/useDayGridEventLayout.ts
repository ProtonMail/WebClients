import { CSSProperties, useMemo } from 'react';

import { CalendarViewBusyEvent, CalendarViewEvent } from '../../containers/calendar/interface';
import { layout } from './layout';
import { toPercent } from './mouseHelpers/mathHelpers';
import { splitDayEventsInInterval } from './splitDayEventsInInterval';

const getIsAllSingle = (eventsInRowSummary: EventsInRowSummary, start: number, end: number) => {
    for (let i = start; i < end; ++i) {
        if (eventsInRowSummary[i].more !== 1) {
            return false;
        }
    }
    return true;
};

export interface DayGridResult {
    more: number;
    events: number[];
}
export interface EventsStyleResult {
    idx: number;
    type: 'event' | 'more';
    style: CSSProperties;
}

export interface EventsInRowSummary {
    [key: number]: DayGridResult;
}
const useDayGridEventLayout = (
    rows: Date[][],
    events: (CalendarViewEvent | CalendarViewBusyEvent)[],
    numberOfRows: number,
    dayEventHeight: number
) => {
    return useMemo(() => {
        return rows.map((row) => {
            const columns = row.length;

            const eventsInRow = splitDayEventsInInterval({
                events,
                min: row[0],
                max: row[columns - 1],
            });

            const eventsLaidOut = layout(eventsInRow);

            let maxRows = 0;

            const eventsInRowSummary = eventsLaidOut.reduce<EventsInRowSummary>((acc, { column: eventRow }, i) => {
                const { start, end } = eventsInRow[i];

                maxRows = Math.max(maxRows, eventRow + 1);

                for (let dayIndex = start; dayIndex < end; ++dayIndex) {
                    if (!acc[dayIndex]) {
                        acc[dayIndex] = { more: 0, events: [] };
                    }
                    acc[dayIndex].events.push(i);
                    if (eventRow >= numberOfRows) {
                        acc[dayIndex].more++;
                    }
                }
                return acc;
            }, {});

            const eventsInRowStyles = eventsLaidOut.reduce<EventsStyleResult[]>((acc, { column: eventRow }, i) => {
                const { start, end } = eventsInRow[i];

                const isHidden = eventRow >= numberOfRows;
                const isAllSingle = isHidden && getIsAllSingle(eventsInRowSummary, start, end);
                if (isAllSingle) {
                    for (let i = start; i < end; ++i) {
                        eventsInRowSummary[i].more = 0;
                    }
                }

                if (eventsInRowSummary[start].more > 0 && isHidden) {
                    return acc;
                }

                const top = eventRow;
                const left = start / columns;
                const width = (end - start) / columns;

                acc.push({
                    idx: i,
                    type: 'event',
                    style: {
                        '--top-custom': `${(top * dayEventHeight) / 16}rem`,
                        '--left-custom': toPercent(left),
                        '--h-custom': `${dayEventHeight / 16}rem`,
                        '--w-custom': toPercent(width),
                    },
                });

                return acc;
            }, []);

            const moreDays = Object.keys(eventsInRowSummary).reduce<EventsStyleResult[]>((acc, dayIndex) => {
                if (eventsInRowSummary[+dayIndex].more <= 0) {
                    return acc;
                }
                acc.push({
                    idx: +dayIndex,
                    type: 'more',
                    style: {
                        '--top-custom': `${(numberOfRows * dayEventHeight) / 16}rem`,
                        '--left-custom': toPercent(+dayIndex / columns),
                        '--h-custom': `${dayEventHeight / 16}rem`,
                        '--w-custom': toPercent(1 / columns),
                    },
                });
                return acc;
            }, []);

            return {
                eventsInRow,
                eventsInRowStyles: eventsInRowStyles.concat(moreDays),
                eventsInRowSummary,
                maxRows,
            };
        });
    }, [rows, events, numberOfRows]);
};

export default useDayGridEventLayout;
