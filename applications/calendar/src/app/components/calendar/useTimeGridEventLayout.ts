import { useMemo } from 'react';

import { toPercent } from './mouseHelpers/mathHelpers';
import { splitTimeGridEventsPerDay } from './splitTimeGridEventsPerDay';
import { layout } from './layout';
import { CalendarViewEvent } from '../../containers/calendar/interface';

export interface EventStyleResult {
    top: string;
    left: string;
    height: string;
    width: string;
}
const useTimeGridEventLayout = (events: CalendarViewEvent[], days: Date[], totalMinutes: number) => {
    return useMemo(() => {
        const eventsPerDay = splitTimeGridEventsPerDay({
            events,
            min: days[0],
            max: days[days.length - 1],
            totalMinutes,
        });

        const eventsLaidOut = Object.keys(eventsPerDay).reduce<{ [key: string]: EventStyleResult[] }>((acc, key) => {
            const eventsInDay = eventsPerDay[key];

            acc[key] = layout(eventsInDay).map(({ column, columns }, i) => {
                const { start, end } = eventsInDay[i];

                const top = start / totalMinutes;
                const height = Math.max(30, end - start) / totalMinutes;

                const width = 1 / columns;
                const left = column * width;

                return {
                    top: toPercent(top),
                    left: toPercent(left),
                    height: toPercent(height),
                    width: toPercent(width),
                };
            });

            return acc;
        }, {});

        return [eventsPerDay, eventsLaidOut];
    }, [events, days, totalMinutes]);
};

export default useTimeGridEventLayout;
