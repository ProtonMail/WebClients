import React, { useRef } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import CalendarContainerView from './CalendarContainerView';
import { VIEWS } from '../../constants';
import TimeGrid from '../../components/calendar/TimeGrid';
import { endOfWeek, startOfWeek } from 'proton-shared/lib/date-fns-utc';

const CalendarContainerViewBlurred = () => {
    const timeGridViewRef = useRef();

    const now = new Date();
    const dateRange = [startOfWeek(now), endOfWeek(now)];
    const containerRef = useRef();

    return (
        <CalendarContainerView
            view={VIEWS.WEEK}
            isBlurred={true}
            isNarrow={false}
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
