import React, { useRef } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { endOfWeek, startOfWeek } from 'proton-shared/lib/date-fns-utc';
import CalendarContainerView from './CalendarContainerView';
import { VIEWS } from '../../constants';
import TimeGrid from '../../components/calendar/TimeGrid';

const CalendarContainerViewBlurred = () => {
    const timeGridViewRef = useRef();

    const now = new Date();
    const dateRange = [startOfWeek(now), endOfWeek(now)];
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <CalendarContainerView
            view={VIEWS.WEEK}
            isBlurred
            utcDate={now}
            utcDefaultDate={now}
            utcDateRange={dateRange}
            onCreateEvent={noop}
            onClickToday={noop}
            onChangeView={noop}
            onChangeDate={noop}
            onChangeDateRange={noop}
            tzid="Europe/Zurich"
            setTzid={noop}
            containerRef={containerRef}
        >
            <TimeGrid now={now} date={now} dateRange={dateRange} components={{}} ref={timeGridViewRef} />
        </CalendarContainerView>
    );
};

export default CalendarContainerViewBlurred;
