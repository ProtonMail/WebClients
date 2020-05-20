import React, { useMemo } from 'react';
import { layout } from '../layout';
import { toPercent } from '../mouseHelpers/mathHelpers';
import getIsBeforeNow from '../getIsBeforeNow';

const MIN_DURATION = 30; // In minutes

const DayEvents = ({
    Component,
    tzid,
    now,
    events,
    eventsInDay,
    totalMinutes,
    targetEventData,
    targetEventRef,
    formatTime,
    dayIndex,
}) => {
    const eventsLaidOut = useMemo(() => {
        return layout(eventsInDay).map(({ column, columns }, i) => {
            const { start, end } = eventsInDay[i];

            const top = start / totalMinutes;
            const height = Math.max(MIN_DURATION, end - start) / totalMinutes;

            const width = 1 / columns;
            const left = column * width;

            return {
                top: toPercent(top),
                left: toPercent(left),
                height: toPercent(height),
                width: toPercent(width),
            };
        });
    }, [eventsInDay, totalMinutes]);

    if (!Array.isArray(eventsInDay)) {
        return null;
    }

    return eventsInDay.map((eventTimeDay, i) => {
        const { idx } = eventTimeDay;
        const event = events[idx];
        const style = eventsLaidOut[i];

        const isTemporary = event.id === 'tmp';
        const isSelected = targetEventData && event.id === targetEventData.id;
        const isThisSelected = (isSelected && isTemporary) || (isSelected && dayIndex === targetEventData.idx);

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isBeforeNow = getIsBeforeNow(event, now);

        return (
            <Component
                event={event}
                style={style}
                key={event.id}
                formatTime={formatTime}
                eventRef={eventRef}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
                tzid={tzid}
            />
        );
    });
};

export default DayEvents;
