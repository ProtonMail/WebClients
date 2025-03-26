import { useRef } from 'react';

import { SETTINGS_VIEW, VIEWS } from '@proton/shared/lib/calendar/constants';
import { endOfWeek, startOfWeek } from '@proton/shared/lib/date-fns-utc';
import noop from '@proton/utils/noop';

import TimeGrid from '../../components/calendar/TimeGrid';
import CalendarContainerView from './CalendarContainerView';
import type { TimeGridRef } from './interface';

interface Props {
    drawerView?: VIEWS;
}
const DummyCalendarContainerView = ({ drawerView }: Props) => {
    const timeGridViewRef = useRef<TimeGridRef>(null);

    const now = new Date();
    const dateRange: [Date, Date] = [startOfWeek(now), endOfWeek(now)];
    const tzid = 'Europe/Zurich';
    const containerRef = useRef<HTMLDivElement>(null); // Define dummy ref to avoid errors

    const calendarUserSettings = {
        WeekLength: 7,
        DisplayWeekNumber: 1,
        DefaultCalendarID: '1',
        AutoDetectPrimaryTimezone: 1,
        PrimaryTimezone: 'America/New_York',
        DisplaySecondaryTimezone: 0,
        SecondaryTimezone: null,
        ViewPreference: SETTINGS_VIEW.WEEK,
        InviteLocale: null,
        AutoImportInvite: 0,
    };

    return (
        <CalendarContainerView
            view={drawerView || VIEWS.WEEK}
            utcDate={now}
            utcDefaultDate={now}
            utcDateRange={dateRange}
            onCreateEvent={noop}
            onCreateCalendarFromSidebar={noop}
            onBackFromSearch={noop}
            onClickToday={noop}
            onClickNextView={noop}
            onClickPreviousView={noop}
            onChangeView={noop}
            onChangeDate={noop}
            onChangeDateRange={noop}
            tzid={tzid}
            setTzid={noop}
            containerRef={containerRef}
            onSearch={noop}
            addresses={[]}
            calendars={[]}
            calendarUserSettings={calendarUserSettings}
            prefetchCalendarEvents={noop}
        >
            <TimeGrid
                tzid={tzid}
                primaryTimezone={tzid}
                now={now}
                date={now}
                dateRange={dateRange}
                actionRef={timeGridViewRef}
                isDrawerApp={!!drawerView}
            />
        </CalendarContainerView>
    );
};

export default DummyCalendarContainerView;
