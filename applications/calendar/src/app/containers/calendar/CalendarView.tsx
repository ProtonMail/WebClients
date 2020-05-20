import React, { Ref } from 'react';
import { c } from 'ttag';

import { VIEWS } from '../../constants';

import TimeGrid from '../../components/calendar/TimeGrid';
import DayGrid from '../../components/calendar/DayGrid';
import FullDayEvent from '../../components/events/FullDayEvent';
import PartDayEvent from '../../components/events/PartDayEvent';
import MoreFullDayEvent from '../../components/events/MoreFullDayEvent';
import { SharedViewProps, TargetEventData, TargetMoreData, TimeGridRef } from './interface';

const { DAY, WEEK, MONTH } = VIEWS;

const components = {
    FullDayEvent,
    PartDayEvent,
    MoreFullDayEvent,
};

interface Props extends SharedViewProps {
    isInteractionEnabled?: boolean;
    onMouseDown: (a: any) => any /** todo */;
    targetEventData?: TargetEventData;
    targetEventRef: Ref<HTMLDivElement>;
    targetMoreData?: TargetMoreData;
    targetMoreRef: Ref<HTMLDivElement>;
    isScrollDisabled: boolean;
    timeGridViewRef: Ref<TimeGridRef>;
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
    const week = c('Label').t`Week`;

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
                displayWeekNumbers={displayWeekNumbers}
                displaySecondaryTimezone={displaySecondaryTimezone}
                now={now}
                date={date}
                dateRange={dateRange}
                events={events}
                formatTime={formatTime}
                onClickDate={onClickDate}
                components={components}
                ref={timeGridViewRef}
                week={week}
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
                components={components}
                weekdaysLong={weekdaysLong}
            />
        );
    }
    return null;
    /*
    if (view === YEAR) {
        return (
            <YearView
                tzid={tzid}
                calendarIDs={visibleCalendars.map(({ ID }) => ID)}
                displayWeekNumbers={displayWeekNumbers}
                currentDate={utcDate}
                onSelectDate={handleClickDateYearView}
            />
        );
    }
    if (view === AGENDA) {
        return (
            <AgendaView
                events={calendarsEvents}
                currentDate={utcDate}
                dateRange={utcDateRange}
                onSelectDate={handleClickDateAgendaView}
            />
        );
    }
     */
};

export default CalendarView;
