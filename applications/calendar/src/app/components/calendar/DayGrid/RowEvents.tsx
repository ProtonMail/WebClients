import React, { Ref } from 'react';
import { endOfDay } from '@proton/shared/lib/date-fns-utc';
import { getEvent } from './helper';
import { TYPE } from '../interactions/constants';
import getIsBeforeNow from '../getIsBeforeNow';
import { CalendarViewEvent, TargetEventData, TargetMoreData } from '../../../containers/calendar/interface';
import FullDayEvent from '../../events/FullDayEvent';
import MoreFullDayEvent from '../../events/MoreFullDayEvent';
import { EventsInRowSummary, EventsStyleResult } from '../useDayGridEventLayout';
import { LayoutEvent } from '../layout';

interface Props {
    days: Date[];
    row: number;
    tzid: string;
    now: Date;
    events: CalendarViewEvent[];
    targetEventRef?: Ref<HTMLDivElement>;
    targetMoreData?: TargetMoreData;
    targetMoreRef?: Ref<HTMLDivElement>;
    targetEventData?: TargetEventData;
    formatTime: (date: Date) => string;
    eventsInRowStyles: EventsStyleResult[];
    eventsInRowSummary: EventsInRowSummary;
    eventsInRow: LayoutEvent[];
}

const RowEvents = ({
    eventsInRowStyles,
    eventsInRowSummary,
    eventsInRow,
    events,

    formatTime,
    days,
    now,
    row,
    tzid,

    targetMoreData,
    targetMoreRef,

    targetEventRef,
    targetEventData,
}: Props) => {
    const startWindow = days[0];
    const lastWindow = endOfDay(days[days.length - 1]);

    const result = eventsInRowStyles.map(({ idx, type, style }) => {
        if (type === 'more') {
            const isSelected = targetMoreData ? idx === targetMoreData.idx && row === targetMoreData.row : false;
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
        const isSelected = targetEventData ? event.id === targetEventData.id : false;
        const isThisSelected =
            (isSelected && isTemporary) ||
            (isSelected && targetEventData && targetEventData.idx === row && targetEventData.type === TYPE.DAYGRID);

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isBeforeNow = getIsBeforeNow(event, now);

        return (
            <FullDayEvent
                tzid={tzid}
                event={event}
                style={style}
                key={event.id}
                eventRef={eventRef}
                formatTime={formatTime}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
                isOutsideEnd={event.isAllDay ? event.end > lastWindow : false}
                isOutsideStart={event.isAllDay ? event.start < startWindow : false}
            />
        );
    });

    return <>{result}</>;
};

export default RowEvents;
