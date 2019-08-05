import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useModals, useCalendars, useAddresses } from 'react-components';
import Calendar from '@toast-ui/react-calendar';
import 'tui-calendar/dist/tui-calendar.css';
import { nextYear, previousYear } from 'proton-shared/lib/helpers/date';

// If you use the default popups, use this.
import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';

import Main from '../components/Main';
import EventModal from '../components/modals/EventModal';
import OverviewSidebar from './OverviewSidebar';
import OverviewToolbar from './OverviewToolbar';
import YearView from '../components/YearView';
import AgendaView from '../components/AgendaView';
import WelcomeModal from '../components/modals/WelcomeModal';
import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;
const DEFAULT_VIEW = WEEK;
const VIEWS_HANDLED_BY_CALENDAR = [DAY, WEEK, MONTH];

const OverviewContainer = () => {
    const [addresses] = useAddresses();
    const welcomeRef = useRef();
    const calendarRef = useRef();
    const [view, setView] = useState(DEFAULT_VIEW);
    const { createModal } = useModals();
    const [currentDate, setDate] = useState(new Date());
    const [calendars, loadingCalendars] = useCalendars();

    const viewHandledByCalendarLibrary = VIEWS_HANDLED_BY_CALENDAR.includes(view);

    const tuiCalendars = useMemo(() => {
        if (!Array.isArray(calendars)) {
            return [];
        }
        return calendars.map(({ ID, Name, Color }) => {
            return {
                id: ID,
                name: Name,
                bgColor: Color,
                borderColor: Color
            };
        });
    }, [calendars]);

    const schedules = [];

    useEffect(() => {
        if (
            !welcomeRef.current &&
            Array.isArray(calendars) &&
            !calendars.length &&
            Array.isArray(addresses) &&
            addresses.length
        ) {
            createModal(<WelcomeModal addresses={addresses} />);
            welcomeRef.current = true;
        }
    }, [calendars, addresses]);

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
            <OverviewSidebar
                onSelectDate={handleSelectDate}
                onSelectDateRange={handleSelectDateRange}
                currentDate={currentDate}
                calendars={calendars}
                loadingCalendars={loadingCalendars}
            />
            <div className="main flex-item-fluid main-area">
                <div className="flex flex-reverse">
                    <Main>
                        <OverviewToolbar
                            view={view}
                            currentDate={currentDate}
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
                                calendars={tuiCalendars}
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
                        {view === YEAR ? <YearView currentDate={currentDate} /> : null}
                        {view === AGENDA ? (
                            <AgendaView
                                currentDate={currentDate}
                                onSelectDate={(date) => (setDate(date), setView(WEEK))}
                            />
                        ) : null}
                    </Main>
                </div>
            </div>
        </>
    );
};

export default OverviewContainer;
