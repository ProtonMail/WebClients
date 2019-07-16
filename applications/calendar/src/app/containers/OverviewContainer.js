import React, { useRef, useState, useEffect } from 'react';
import { useModals } from 'react-components';
import { Route } from 'react-router';
import Calendar from '@toast-ui/react-calendar';
import 'tui-calendar/dist/tui-calendar.css';
import { nextYear, previousYear } from 'proton-shared/lib/helpers/date';

// If you use the default popups, use this.
import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';

import Main from '../components/Main';
import EventModal from '../components/modals/EventModal';
import AuthSidebar from '../components/layout/AuthSidebar';
import Toolbar from '../components/Toolbar';
import YearView from '../components/YearView';
import PlanningView from '../components/PlanningView';

const DEFAULT_VIEW = 'week';
const today = new Date();
const VIEWS_HANDLED_BY_CALENDAR = ['day', 'week', 'month'];

const getDate = (type, start, value, operator) => {
    start = new Date(start);
    type = type.charAt(0).toUpperCase() + type.slice(1);

    if (operator === '+') {
        start[`set${type}`](start[`get${type}`]() + value);
    } else {
        start[`set${type}`](start[`get${type}`]() - value);
    }

    return start;
};

const OverviewContainer = () => {
    const calendarRef = useRef();
    const [view, setView] = useState(DEFAULT_VIEW);
    const viewHandledByCalendarLibrary = VIEWS_HANDLED_BY_CALENDAR.includes(view);
    const { createModal } = useModals();
    const [currentDate, setDate] = useState(new Date());
    const [calendars] = useState([
        {
            id: '0',
            name: 'Private',
            bgColor: '#9e5fff',
            borderColor: '#9e5fff'
        },
        {
            id: '1',
            name: 'Company',
            bgColor: '#00a9ff',
            borderColor: '#00a9ff'
        }
    ]);
    const [schedules] = useState([
        {
            id: '1',
            calendarId: '0',
            title: 'TOAST UI Calendar Study',
            category: 'time',
            dueDateClass: '',
            start: today.toISOString(),
            end: getDate('hours', today, 3, '+').toISOString()
        },
        {
            id: '2',
            calendarId: '0',
            title: 'Practice',
            category: 'milestone',
            dueDateClass: '',
            start: getDate('date', today, 1, '+').toISOString(),
            end: getDate('date', today, 1, '+').toISOString(),
            isReadOnly: true
        },
        {
            id: '3',
            calendarId: '0',
            title: 'FE Workshop',
            category: 'allday',
            dueDateClass: '',
            start: getDate('date', today, 2, '-').toISOString(),
            end: getDate('date', today, 1, '-').toISOString(),
            isReadOnly: true
        },
        {
            id: '4',
            calendarId: '0',
            title: 'Report',
            category: 'time',
            dueDateClass: '',
            start: today.toISOString(),
            end: getDate('hours', today, 1, '+').toISOString()
        }
    ]);

    const handleSelectDate = (date) => {
        setDate(date);
    };
    const handleSelectDateRange = (rangeStart, rangeEnd) => {
        console.log('range selected', rangeStart, rangeEnd);
    };
    const getCalendarDate = () =>
        calendarRef.current
            .getInstance()
            .getDate()
            .toDate();

    const handlePrev = () => {
        viewHandledByCalendarLibrary && calendarRef.current.getInstance().prev();
        setDate(viewHandledByCalendarLibrary ? getCalendarDate() : previousYear(currentDate));
    };

    const handleNext = () => {
        viewHandledByCalendarLibrary && calendarRef.current.getInstance().next();
        setDate(viewHandledByCalendarLibrary ? getCalendarDate() : nextYear(currentDate));
    };

    const handleToday = () => {
        viewHandledByCalendarLibrary && calendarRef.current.getInstance().today();
        setDate(new Date());
    };

    const handleChangeView = (newView) => {
        VIEWS_HANDLED_BY_CALENDAR.includes(newView) && calendarRef.current.getInstance().changeView(newView, true);
        setView(newView);
    };

    // when click a schedule.
    const handleSchedule = (event) => {
        console.log(event);
    };

    // when click a schedule.
    const handleMore = (event) => {
        console.log(event);
    };

    // when select time period in daily, weekly, monthly.
    const handleBeforeCreateSchedule = ({ start, end, isAllDay }) => {
        createModal(<EventModal start={start.toDate()} end={end.toDate()} allDay={isAllDay} />);
    };

    // when drag a schedule to change time in daily, weekly, monthly.
    const handleBeforeUpdateSchedule = () => {
        console.log(event);
    };

    useEffect(() => {
        calendarRef.current.getInstance().setDate(currentDate);
        // TODO call the API (date ranges)
    }, [currentDate]);

    return (
        <>
            <Route
                path="/:path"
                render={() => (
                    <AuthSidebar
                        onSelectDate={handleSelectDate}
                        onSelectDateRange={handleSelectDateRange}
                        currentDate={currentDate}
                    />
                )}
            />
            <div className="main flex-item-fluid main-area">
                <div className="flex flex-reverse">
                    <Main>
                        <Toolbar
                            view={view}
                            onChangeView={handleChangeView}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onToday={handleToday}
                        />
                        <div hidden={!VIEWS_HANDLED_BY_CALENDAR.includes(view)}>
                            <Calendar
                                onBeforeCreateSchedule={handleBeforeCreateSchedule}
                                onBeforeUpdateSchedule={handleBeforeUpdateSchedule}
                                onClickSchedule={handleSchedule}
                                onClickMore={handleMore}
                                usageStatistics={false}
                                disableDblClick={true}
                                ref={calendarRef}
                                height="800px"
                                className="flex"
                                calendars={calendars}
                                month={{
                                    startDayOfWeek: 0
                                }}
                                schedules={schedules}
                                scheduleView
                                taskView={false}
                                template={{
                                    allday(schedule) {
                                        return `${schedule.title}<i class="fa fa-refresh"></i>`;
                                    },
                                    alldayTitle() {
                                        return 'All Day';
                                    }
                                }}
                                timezones={[
                                    {
                                        timezoneOffset: 120,
                                        displayLabel: 'GMT+02:00',
                                        tooltip: 'Seoul'
                                    }
                                ]}
                                useDetailPopup
                                week={{
                                    showTimezoneCollapseButton: true,
                                    timezonesCollapsed: true
                                }}
                            />
                        </div>
                        {view === 'year' ? <YearView currentDate={currentDate} /> : null}
                        {view === 'planning' ? <PlanningView currentDate={currentDate} /> : null}
                    </Main>
                </div>
            </div>
        </>
    );
};

export default OverviewContainer;
