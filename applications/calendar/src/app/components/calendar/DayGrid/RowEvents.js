import React from 'react';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';
import { getEvent } from '../DayGrid';
import { TYPE } from '../interactions/constants';

const RowEvents = ({
    FullDayEvent,
    MoreFullDayEvent,

    eventsInRowStyles,
    eventsInRowSummary,
    eventsInRow,
    events,

    formatTime,
    now,

    targetMoreData,
    targetMoreRef,

    targetEventRef,
    targetEventData
}) => {
    return eventsInRowStyles.map(({ idx, type, style }) => {
        if (type === 'more') {
            const isSelected = targetMoreData && idx === targetMoreData.idx && 0 === targetMoreData.row;
            const eventRef = isSelected ? targetMoreRef : undefined;
            return (
                <MoreFullDayEvent
                    key={`more${idx}`}
                    style={style}
                    more={eventsInRowSummary[idx].more}
                    eventRef={eventRef}
                    isSelected={isSelected}
                />
            );
        }

        const event = getEvent(idx, eventsInRow, events);

        const isTemporary = event.id === 'tmp';
        const isSelected = targetEventData && event.id === targetEventData.id;
        const isThisSelected = (isSelected && isTemporary) || isSelected &&
            targetEventData.idx === 0 &&
            targetEventData.type === TYPE.DAYGRID;

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isBeforeNow = now > event.end && !isSameDay(now, event.end);

        return (
            <FullDayEvent
                event={event}
                style={style}
                key={event.id}
                eventRef={eventRef}
                formatTime={formatTime}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
            />
        );
    });
};

export default RowEvents;
