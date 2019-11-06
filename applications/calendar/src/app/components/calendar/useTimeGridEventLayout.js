import { useMemo } from 'react';

import { toPercent } from './mouseHelpers/mathHelpers';
import { splitTimeGridEventsPerDay } from './splitTimeGridEventsPerDay';
import { layout } from './layout';

const useTimeGridEventLayout = (events, days, totalMinutes) => {
    return useMemo(() => {
        const eventsPerDay = splitTimeGridEventsPerDay({
            events: events,
            min: days[0],
            max: days[days.length - 1],
            totalMinutes
        });

        const eventsLaidOut = Object.keys(eventsPerDay).reduce((acc, key) => {
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
                    width: toPercent(width)
                };
            });

            return acc;
        }, {});

        return [eventsPerDay, eventsLaidOut];
    }, [events, days, totalMinutes]);
};

export default useTimeGridEventLayout;
