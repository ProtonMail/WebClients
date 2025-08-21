import type { MutableRefObject, Ref, RefObject } from 'react';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import DayGrid from '../../components/calendar/DayGrid';
import TimeGrid from '../../components/calendar/TimeGrid';
import type { OnMouseDown } from '../../components/calendar/interactions/interface';
import type { OpenedMailEvent } from '../../hooks/useGetOpenedMailEvents';
import type { CalendarsEventsCache } from './eventStore/interface';
import type { InteractiveState, SharedViewProps, TargetEventData, TargetMoreData, TimeGridRef } from './interface';
import CalendarSearchView from './search/CalendarSearchView';

interface Props extends SharedViewProps {
    calendars: VisualCalendar[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    isInteractionEnabled?: boolean;
    onMouseDown: OnMouseDown;
    targetEventData?: TargetEventData;
    setTargetEventRef: (targetEvent: HTMLElement | null) => void;
    setInteractiveData: (state: InteractiveState) => void;
    getOpenedMailEvents: () => OpenedMailEvent[];
    targetMoreData?: TargetMoreData;
    targetMoreRef: Ref<HTMLDivElement>;
    isScrollDisabled: boolean;
    timeGridViewRef: RefObject<TimeGridRef>;
    weekdays: string[];
    weekdaysSingle: string[];
    formatTime: (date: Date) => string;
    formatDate: (date: Date) => string;
    isDrawerApp?: boolean;
    onBackFromSearch: () => void;
}
const CalendarView = ({
    calendars,
    calendarsEventsCacheRef,
    view,

    isInteractionEnabled,
    onMouseDown,

    tzid,
    primaryTimezone,
    secondaryTimezone,
    secondaryTimezoneOffset,

    targetEventData,
    targetMoreData,
    targetMoreRef,

    setTargetEventRef,
    setInteractiveData,
    getOpenedMailEvents,

    displayWeekNumbers,
    displaySecondaryTimezone,

    now,
    date,
    dateRange,
    events,

    onClickDate,
    onChangeDate,
    onClickToday,
    onBackFromSearch,
    timeGridViewRef,
    isScrollDisabled,

    weekdays,
    weekdaysSingle,
    formatTime,
    formatDate,

    isDrawerApp,
    ...rest
}: Props) => {
    if ([VIEWS.DAY, VIEWS.WEEK, VIEWS.MAIL, VIEWS.DRIVE].includes(view)) {
        return (
            <TimeGrid
                tzid={tzid}
                primaryTimezone={primaryTimezone}
                secondaryTimezone={secondaryTimezone}
                secondaryTimezoneOffset={secondaryTimezoneOffset}
                isInteractionEnabled={isInteractionEnabled}
                isScrollDisabled={isScrollDisabled}
                onMouseDown={onMouseDown}
                targetEventData={targetEventData}
                targetEventRef={setTargetEventRef}
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
                {...rest}
            />
        );
    }
    if (view === VIEWS.MONTH) {
        return (
            <DayGrid
                tzid={tzid}
                isInteractionEnabled={isInteractionEnabled}
                onMouseDown={onMouseDown}
                targetEventData={targetEventData}
                targetEventRef={setTargetEventRef}
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
                {...rest}
            />
        );
    }
    if (view === VIEWS.SEARCH) {
        return (
            <CalendarSearchView
                calendars={calendars}
                calendarsEventsCacheRef={calendarsEventsCacheRef}
                tzid={tzid}
                date={date}
                now={now}
                setTargetEventRef={setTargetEventRef}
                setInteractiveData={setInteractiveData}
                getOpenedMailEvents={getOpenedMailEvents}
                onBackFromSearch={onBackFromSearch}
            />
        );
    }
    return null;
};

export default CalendarView;
