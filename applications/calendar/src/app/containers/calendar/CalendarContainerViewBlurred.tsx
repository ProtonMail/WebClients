import React, { useRef } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { endOfWeek, startOfWeek } from 'proton-shared/lib/date-fns-utc';
import { VIEWS } from 'proton-shared/lib/calendar/constants';
import CalendarContainerView from './CalendarContainerView';
import TimeGrid from '../../components/calendar/TimeGrid';
import { TimeGridRef } from './interface';

const CalendarContainerViewBlurred = () => {
    const timeGridViewRef = useRef<TimeGridRef>(null);

    const now = new Date();
    const dateRange: [Date, Date] = [startOfWeek(now), endOfWeek(now)];
    const containerRef = useRef<HTMLDivElement>(null);
    const tzid = 'Europe/Zurich';

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
            tzid={tzid}
            setTzid={noop}
            containerRef={containerRef}
        >
            <TimeGrid
                tzid={tzid}
                primaryTimezone={tzid}
                now={now}
                date={now}
                dateRange={dateRange}
                actionRef={timeGridViewRef}
            />
        </CalendarContainerView>
    );
};

export default CalendarContainerViewBlurred;
