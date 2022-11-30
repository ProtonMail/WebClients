import { Ref, RefObject } from 'react';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

import DayGrid from '../../components/calendar/DayGrid';
import TimeGrid from '../../components/calendar/TimeGrid';
import { OnMouseDown } from '../../components/calendar/interactions/interface';
import { SharedViewProps, TargetEventData, TargetMoreData, TimeGridRef } from './interface';

const { DAY, WEEK, MONTH, MAIL, DRIVE } = VIEWS;

interface Props extends SharedViewProps {
    isInteractionEnabled?: boolean;
    onMouseDown: OnMouseDown;
    targetEventData?: TargetEventData;
    targetEventRef: Ref<HTMLDivElement>;
    targetMoreData?: TargetMoreData;
    targetMoreRef: Ref<HTMLDivElement>;
    isScrollDisabled: boolean;
    timeGridViewRef: RefObject<TimeGridRef>;
    weekdays: string[];
    weekdaysSingle: string[];
    formatTime: (date: Date) => string;
    formatDate: (date: Date) => string;
    isDrawerApp?: boolean;
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
    onChangeDate,
    onClickToday,
    timeGridViewRef,
    isScrollDisabled,

    weekdays,
    weekdaysSingle,
    formatTime,
    formatDate,

    isDrawerApp,
}: Props) => {
    if ([DAY, WEEK, MAIL, DRIVE].includes(view)) {
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
                onChangeDate={onChangeDate}
                onClickToday={onClickToday}
                actionRef={timeGridViewRef}
                weekdays={weekdays}
                weekdaysSingle={weekdaysSingle}
                isDrawerApp={isDrawerApp}
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
                weekdaysLong={weekdays}
            />
        );
    }
    return null;
};

export default CalendarView;
