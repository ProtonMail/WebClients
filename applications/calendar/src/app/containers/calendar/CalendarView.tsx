import React, { Ref, RefObject } from 'react';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

import TimeGrid from '../../components/calendar/TimeGrid';
import DayGrid from '../../components/calendar/DayGrid';
import { SharedViewProps, TargetEventData, TargetMoreData, TimeGridRef } from './interface';
import { OnMouseDown } from '../../components/calendar/interactions/interface';

const { DAY, WEEK, MONTH } = VIEWS;

interface Props extends SharedViewProps {
    isInteractionEnabled?: boolean;
    onMouseDown: OnMouseDown;
    targetEventData?: TargetEventData;
    targetEventRef: Ref<HTMLDivElement>;
    targetMoreData?: TargetMoreData;
    targetMoreRef: Ref<HTMLDivElement>;
    isScrollDisabled: boolean;
    timeGridViewRef: RefObject<TimeGridRef>;
    weekdaysLong: string[];
    formatTime: (date: Date) => string;
    formatDate: (date: Date) => string;
}
const CalendarView = ({
    view,
    isNarrow,

    isInteractionEnabled,
    onMouseDown,

    tzid,
    primaryTimezone,
    secondaryTimezone,
    secondaryTimezoneOffset,

    targetEventData,
    targetEventRef,
    targetMoreData,
    targetMoreRef,

    displayWeekNumbers,
    displaySecondaryTimezone,

    now,
    date,
    dateRange,
    events,

    onClickDate,
    timeGridViewRef,
    isScrollDisabled,

    weekdaysLong,
    formatTime,
    formatDate,
}: Props) => {
    if (view === DAY || view === WEEK) {
        return (
            <TimeGrid
                isNarrow={isNarrow}
                tzid={tzid}
                primaryTimezone={primaryTimezone}
                secondaryTimezone={secondaryTimezone}
                secondaryTimezoneOffset={secondaryTimezoneOffset}
                isInteractionEnabled={isInteractionEnabled}
                isScrollDisabled={isScrollDisabled}
                onMouseDown={onMouseDown}
                targetEventData={targetEventData}
                targetEventRef={targetEventRef}
                targetMoreRef={targetMoreRef}
                targetMoreData={targetMoreData}
                displaySecondaryTimezone={displaySecondaryTimezone}
                now={now}
                date={date}
                dateRange={dateRange}
                events={events}
                formatTime={formatTime}
                onClickDate={onClickDate}
                actionRef={timeGridViewRef}
                weekdaysLong={weekdaysLong}
            />
        );
    }
    if (view === MONTH) {
        return (
            <DayGrid
                tzid={tzid}
                isInteractionEnabled={isInteractionEnabled}
                onMouseDown={onMouseDown}
                targetEventData={targetEventData}
                targetEventRef={targetEventRef}
                targetMoreData={targetMoreData}
                targetMoreRef={targetMoreRef}
                displayWeekNumbers={displayWeekNumbers}
                date={date}
                dateRange={dateRange}
                now={now}
                events={events}
                formatTime={formatTime}
                formatDate={formatDate}
                onClickDate={onClickDate}
                weekdaysLong={weekdaysLong}
            />
        );
    }
    return null;
};

export default CalendarView;
