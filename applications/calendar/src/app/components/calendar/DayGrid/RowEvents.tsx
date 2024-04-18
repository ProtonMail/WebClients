import { Ref } from 'react';

import { addDays } from '@proton/shared/lib/date-fns-utc';

import {
    CalendarViewBusyEvent,
    CalendarViewEvent,
    TargetEventData,
    TargetMoreData,
} from '../../../containers/calendar/interface';
import { isBusySlotEvent } from '../../../helpers/busySlots';
import FullDayBusyEvent from '../../events/FullDayBusyEvent';
import FullDayEvent from '../../events/FullDayEvent';
import MoreFullDayEvent from '../../events/MoreFullDayEvent';
import getIsBeforeNow from '../getIsBeforeNow';
import { TYPE } from '../interactions/constants';
import { LayoutEvent } from '../layout';
import { EventsInRowSummary, EventsStyleResult } from '../useDayGridEventLayout';
import { getEvent } from './helper';

interface Props {
    days: Date[];
    row: number;
    tzid: string;
    now: Date;
    events: (CalendarViewEvent | CalendarViewBusyEvent)[];
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
    const lastWindow = addDays(days[days.length - 1], 1);

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

        const isTemporary = event.uniqueId === 'tmp';
        const isSelected = targetEventData ? event.uniqueId === targetEventData.uniqueId : false;
        const isThisSelected =
            (isSelected && isTemporary) ||
            (isSelected && targetEventData && targetEventData.idx === row && targetEventData.type === TYPE.DAYGRID);

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isBeforeNow = getIsBeforeNow(event, now);

        const modifiedEnd = event.isAllDay && !event.isAllPartDay ? addDays(event.end, 1) : event.end;

        return isBusySlotEvent(event) ? (
            <FullDayBusyEvent
                event={event}
                formatTime={formatTime}
                isBeforeNow={isBeforeNow}
                isOutsideEnd={event.isAllDay ? modifiedEnd > lastWindow : false}
                isOutsideStart={event.isAllDay ? event.start < startWindow : false}
                style={style}
                key={event.uniqueId}
                eventRef={eventRef}
            />
        ) : (
            <FullDayEvent
                tzid={tzid}
                event={event}
                style={style}
                key={event.uniqueId}
                eventRef={eventRef}
                formatTime={formatTime}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
                isOutsideEnd={event.isAllDay ? modifiedEnd > lastWindow : false}
                isOutsideStart={event.isAllDay ? event.start < startWindow : false}
            />
        );
    });

    return <>{result}</>;
};

export default RowEvents;
