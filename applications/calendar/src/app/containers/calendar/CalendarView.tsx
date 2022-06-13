import { Ref, RefObject } from 'react';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

import TimeGrid from '../../components/calendar/TimeGrid';
import DayGrid from '../../components/calendar/DayGrid';
import { SharedViewProps, TargetEventData, TargetMoreData, TimeGridRef } from './interface';
import { OnMouseDown } from '../../components/calendar/interactions/interface';

const { DAY, WEEK, MONTH, MAIL } = VIEWS;

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
    isSideApp?: boolean;
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
    timeGridViewRef,
    isScrollDisabled,

    weekdays,
    weekdaysSingle,
    formatTime,
    formatDate,

    isSideApp,
}: Props) => {
    if (view === DAY || view === WEEK || view === MAIL) {
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
                actionRef={timeGridViewRef}
                weekdays={weekdays}
                weekdaysSingle={weekdaysSingle}
                isSideApp={isSideApp}
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
