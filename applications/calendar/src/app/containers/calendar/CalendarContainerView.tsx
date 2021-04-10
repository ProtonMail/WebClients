import { MAXIMUM_DATE, MINIMUM_DATE, VIEWS } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import React, { ReactNode, Ref, useCallback, useEffect, useMemo } from 'react';
import {
    FullLoader,
    LocalizedMiniCalendar,
    useToggle,
    TextLoader,
    PrivateHeader,
    PrivateMainArea,
    PrivateAppContainer,
    FloatingButton,
    MainLogo,
    TimezoneSelector,
    TopNavbarListItemSettingsButton,
    Icon,
} from 'react-components';
import { c } from 'ttag';
import { differenceInCalendarDays } from 'date-fns';

import { fromUTCDate, toLocalDate } from 'proton-shared/lib/date/timezone';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { APPS } from 'proton-shared/lib/constants';
import CalendarSidebar from './CalendarSidebar';
import CalendarToolbar from './CalendarToolbar';
import DateCursorButtons from '../../components/DateCursorButtons';
import ViewSelector from '../../components/ViewSelector';

import getDateDiff from './getDateDiff';

/**
 * Converts a local date into the corresponding UTC date at 0 hours.
 */
const localToUtcDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

interface Props {
    activeCalendars?: Calendar[];
    disabledCalendars?: Calendar[];
    isLoading?: boolean;
    isNarrow?: boolean;
    isBlurred?: boolean;
    displayWeekNumbers?: boolean;
    weekStartsOn?: WeekStartsOn;
    tzid: string;
    setTzid: (tzid: string) => void;
    range?: number;
    children: ReactNode;
    view: VIEWS;
    utcDefaultDate: Date;
    utcDate: Date;
    utcDateRange: Date[];
    utcDateRangeInTimezone?: Date[];
    onCreateEvent?: () => void;
    onClickToday: () => void;
    onChangeView: (view: VIEWS) => void;
    onChangeDate: (date: Date) => void;
    onChangeDateRange: (date: Date, range: number) => void;
    containerRef: Ref<HTMLDivElement>;
}

const CalendarContainerView = ({
    activeCalendars = [],
    disabledCalendars = [],
    isLoading = false,
    isBlurred = false,
    isNarrow = false,
    displayWeekNumbers = false,
    weekStartsOn = 0,

    tzid,
    setTzid,

    range = 0,
    view,
    utcDefaultDate,
    utcDate,
    utcDateRange,
    utcDateRangeInTimezone,

    onCreateEvent,
    onClickToday,
    onChangeView,
    onChangeDate,
    onChangeDateRange,

    children,
    containerRef,
}: Props) => {
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();

    const localNowDate = useMemo(() => {
        return new Date(utcDefaultDate.getUTCFullYear(), utcDefaultDate.getUTCMonth(), utcDefaultDate.getUTCDate());
    }, [utcDefaultDate]);

    const localDate = useMemo(() => {
        return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
    }, [utcDate]);

    const localDateRange = useMemo((): [Date, Date] => {
        const [utcStart, utcEnd] = utcDateRange;
        return [toLocalDate(fromUTCDate(utcStart)), toLocalDate(fromUTCDate(utcEnd))];
    }, [utcDateRange]);

    const handleSelectDateRange = useCallback(([start, end]) => {
        const numberOfDays = differenceInCalendarDays(end, start);
        const newDate = localToUtcDate(start);
        onChangeDateRange(newDate, numberOfDays);
    }, []);

    const handleClickLocalDate = useCallback((newDate) => {
        onChangeDate(localToUtcDate(newDate));
    }, []);

    const handleClickNext = useCallback(() => {
        onChangeDate(getDateDiff(utcDate, range, view, 1));
    }, [utcDate, range, view]);

    const handleClickPrev = useCallback(() => {
        onChangeDate(getDateDiff(utcDate, range, view, -1));
    }, [utcDate, range, view]);

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const logo = <MainLogo to="/" />;
    const header = (
        <PrivateHeader
            logo={logo}
            settingsButton={<TopNavbarListItemSettingsButton to="/calendar" toApp={APPS.PROTONACCOUNT} />}
            floatingButton={
                <FloatingButton onClick={onCreateEvent}>
                    <Icon size={24} name="plus" className="mauto" />
                </FloatingButton>
            }
            title={c('Title').t`Calendar`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <CalendarSidebar
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onCreateEvent={onCreateEvent}
            miniCalendar={
                <LocalizedMiniCalendar
                    min={MINIMUM_DATE}
                    max={MAXIMUM_DATE}
                    onSelectDateRange={handleSelectDateRange}
                    onSelectDate={handleClickLocalDate}
                    date={localDate}
                    now={localNowDate}
                    displayWeekNumbers={displayWeekNumbers}
                    dateRange={range > 0 ? localDateRange : undefined}
                    weekStartsOn={weekStartsOn}
                    displayedOnDarkBackground
                />
            }
            activeCalendars={activeCalendars}
            disabledCalendars={disabledCalendars}
        />
    );

    const loader = isLoading ? (
        <div className="calendar-loader-container text-center p1">
            <FullLoader size={60} />
            <TextLoader className="m0">{c('Info').t`Loading events`}</TextLoader>
        </div>
    ) : null;

    return (
        <PrivateAppContainer header={header} sidebar={sidebar} isBlurred={isBlurred} containerRef={containerRef}>
            {loader}
            <CalendarToolbar
                dateCursorButtons={
                    <DateCursorButtons
                        view={view}
                        range={range}
                        dateRange={localDateRange}
                        currentDate={localDate}
                        now={localNowDate}
                        onToday={onClickToday}
                        onNext={handleClickNext}
                        onPrev={handleClickPrev}
                    />
                }
                viewSelector={
                    <ViewSelector
                        data-test-id="calendar-view:view-options"
                        view={view}
                        range={range}
                        onChange={onChangeView}
                    />
                }
                timezoneSelector={
                    <TimezoneSelector
                        data-test-id="calendar-view:time-zone-dropdown"
                        className="no-mobile no-tablet"
                        date={utcDateRangeInTimezone ? utcDateRangeInTimezone[0] : localNowDate}
                        timezone={tzid}
                        onChange={setTzid}
                    />
                }
            />
            <PrivateMainArea hasToolbar data-test-id="calendar-view:events-area">
                {children}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default CalendarContainerView;
