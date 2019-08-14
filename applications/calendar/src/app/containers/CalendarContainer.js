import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    useModals,
    useCalendars,
    useUserKeys,
    useAddresses,
    useAddressesKeys,
    useUser,
    Loader,
    AppsSidebar
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import Calendar from '@toast-ui/react-calendar';
import 'tui-calendar/dist/tui-calendar.css';

// If you use the default popups, use this.
import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';

import Main from '../components/Main';
import EventModal from '../components/modals/EventModal';
import CalendarSidebar from './CalendarSidebar';
import CalendarToolbar from './CalendarToolbar';
import YearView from '../components/YearView';
import AgendaView from '../components/AgendaView';
import WelcomeModal from '../components/modals/WelcomeModal';
import { VIEWS } from '../constants';
import useCalendarsBootstrap from './useCalendarsBootstrap';
import useCalendarsKeys from './useCalendarsKeys';
import useCalendarsEvents from './useCalendarsEvents';
import MiniCalendar from '../components/miniCalendar/MiniCalendar';
import { getDateDiff, getDateRange } from './helper';
import { fromICAL } from '../helpers/vcard';
import PrivateHeader from '../components/layout/PrivateHeader';

const { DAY, WEEK, MONTH, YEAR, CUSTOM, AGENDA } = VIEWS;
const DEFAULT_VIEW = WEEK;
const VIEWS_HANDLED_BY_CALENDAR = [DAY, WEEK, MONTH, CUSTOM];

const CalendarContainer = () => {
    const [user] = useUser();
    const [userKeysList] = useUserKeys(user);
    const [addresses, loadingAddresses] = useAddresses();
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(user, addresses, userKeysList);
    const [calendars, loadingCalendars] = useCalendars();
    const visibleCalendars = useMemo(() => {
        return calendars ? calendars.filter(({ Display }) => !!Display) : undefined;
    }, [calendars]);
    const [calendarsBootstrap, loadingBootstrap] = useCalendarsBootstrap(visibleCalendars);
    const [calendarsKeys, loadingCalendarsKeys] = useCalendarsKeys(
        visibleCalendars,
        calendarsBootstrap,
        addresses,
        addressesKeysMap
    );
    const weekStartsOn = 1; // Will come from calendar settings
    const [view, setView] = useState(DEFAULT_VIEW);
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [dateRange, setDateRange] = useState(() => getDateRange(currentDate, view, weekStartsOn));
    const [calendarsEvents, loadingEvents] = useCalendarsEvents(calendars, dateRange);

    const welcomeRef = useRef();
    const calendarRef = useRef();
    const { createModal } = useModals();

    const tuiCalendars = useMemo(() => {
        if (!Array.isArray(visibleCalendars)) {
            return [];
        }
        return visibleCalendars.map(({ ID, Name, Color }) => {
            return {
                id: ID,
                name: Name,
                bgColor: Color,
                borderColor: Color
            };
        });
    }, [visibleCalendars]);
    const tuiMonth = useMemo(() => {
        return {
            startDayOfWeek: weekStartsOn
        };
    }, [weekStartsOn]);
    const tuiWeek = useMemo(() => {
        return {
            startDayOfWeek: weekStartsOn
        };
    }, [weekStartsOn]);

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
        setCurrentDate(date);

        if (view === CUSTOM) {
            setDateRange(getDateRange(date, WEEK, weekStartsOn));
            setView(WEEK);
            return;
        }

        setDateRange(getDateRange(date, view, weekStartsOn));
    };

    const handleSelectDateRange = ([rangeStart, rangeEnd]) => {
        setDateRange([rangeStart, rangeEnd]);
        setView(CUSTOM);
    };

    const handlePrev = () => {
        const prevDate = getDateDiff(currentDate, view, -1);
        setCurrentDate(prevDate);
        setDateRange(getDateRange(prevDate, view, weekStartsOn));
    };

    const handleNext = () => {
        const nextDate = getDateDiff(currentDate, view, 1);
        setCurrentDate(nextDate);
        setDateRange(getDateRange(nextDate, view, weekStartsOn));
    };

    const handleSelectToday = () => {
        handleSelectDate(new Date());
    };

    const handleSelectDateYear = (date) => {
        setCurrentDate(date);
        setDateRange(getDateRange(date, WEEK, weekStartsOn));
        setView(WEEK);
    };

    const handleSelectDateAgenda = (date) => {
        setCurrentDate(date);
        setDateRange(getDateRange(date, WEEK, weekStartsOn));
        setView(WEEK);
    };

    const handleChangeView = (newView) => {
        setDateRange(getDateRange(currentDate, newView, weekStartsOn));
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
        if (calendarRef.current) {
            calendarRef.current.getInstance().setDate(currentDate);
        }
    }, [currentDate]);
    useEffect(() => {
        if (calendarRef.current && VIEWS_HANDLED_BY_CALENDAR.includes(view)) {
            calendarRef.current.getInstance().changeView(view, true);
        }
    }, [view, calendarRef.current]);

    const isLoading =
        loadingAddresses || loadingAddressesKeys || loadingBootstrap || loadingCalendarsKeys || loadingEvents;

    const tuiSchedules = useMemo(() => {
        if (!Array.isArray(visibleCalendars) || !calendarsEvents) {
            return [];
        }
        return visibleCalendars
            .map(({ ID: CalendarID, Color }) => {
                const calendarEvents = calendarsEvents[CalendarID] || [];
                return calendarEvents.map(({ ID, Author, SharedEvents }) => {
                    const { Data = '' } = SharedEvents.find(({ Type }) => Type === 2);
                    const properties = fromICAL(Data);

                    const start = new Date(properties.find(({ field }) => field === 'dtstart').value);
                    const end = new Date(properties.find(({ field }) => field === 'dtend').value);

                    return {
                        id: ID,
                        calendarId: CalendarID,
                        bgColor: Color,
                        title: `${Author} Encrypted`,
                        category: 'time',
                        start: start,
                        end: end
                    };
                });
            })
            .flat();
    }, [calendarsEvents]);

    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar currentApp={APPS.PROTONCALENDAR} />
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader />
                <div className="flex flex-nowrap">
                    <CalendarSidebar
                        miniCalendar={
                            <MiniCalendar
                                onSelectDateRange={handleSelectDateRange}
                                onSelectDate={handleSelectDate}
                                date={currentDate}
                                hasWeekNumbers={false}
                                dateRange={view === CUSTOM ? dateRange : undefined}
                                weekStartsOn={weekStartsOn}
                            />
                        }
                        calendars={calendars}
                        loadingCalendars={loadingCalendars}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '10px',
                            left: '10px',
                            background: '#fff',
                            display: isLoading ? 'block' : 'none'
                        }}
                    >
                        <Loader />
                    </div>
                    <div className="main flex-item-fluid main-area">
                        <div className="flex flex-reverse">
                            <Main>
                                <CalendarToolbar
                                    view={view}
                                    currentDate={currentDate}
                                    dateRange={dateRange}
                                    onChangeView={handleChangeView}
                                    onNext={handleNext}
                                    onPrev={handlePrev}
                                    onToday={handleSelectToday}
                                />
                                {VIEWS_HANDLED_BY_CALENDAR.includes(view) ? (
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
                                        schedules={tuiSchedules}
                                        month={tuiMonth}
                                        week={tuiWeek}
                                        scheduleView
                                        taskView={false}
                                        useDetailPopup
                                    />
                                ) : null}
                                {view === YEAR ? (
                                    <YearView currentDate={currentDate} onSelectDate={handleSelectDateYear} />
                                ) : null}
                                {view === AGENDA ? (
                                    <AgendaView currentDate={currentDate} onSelectDate={handleSelectDateAgenda} />
                                ) : null}
                            </Main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarContainer;
