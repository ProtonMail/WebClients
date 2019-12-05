import React from 'react';

const DayEvents = ({
    Component,
    now,
    eventsPerDay,
    eventsLaidOut,
    timeEvents,
    targetEventData,
    targetEventRef,
    formatTime,
    dayIndex
}) => {
    if (!Array.isArray(eventsPerDay)) {
        return null;
    }

    return eventsPerDay.map((eventTimeDay, i) => {
        const { idx } = eventTimeDay;
        const event = timeEvents[idx];
        const style = eventsLaidOut[i];

        const isTemporary = event.id === 'tmp';
        const isSelected = targetEventData && event.id === targetEventData.id;
        const isThisSelected = (isSelected && isTemporary) || isSelected && dayIndex === targetEventData.idx;

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isBeforeNow = now > event.end;

        return (
            <Component
                event={event}
                style={style}
                key={event.id}
                formatTime={formatTime}
                eventRef={eventRef}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
            />
        );
    });
};

export default DayEvents;
