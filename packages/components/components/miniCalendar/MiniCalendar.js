import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addMonths } from 'date-fns';

import { getDaysInMonth } from './helper';
import { classnames } from '../../helpers/component';
import MonthDays from './MonthDays';
import WeekDays from './WeekDays';
import WeekNumbers from './WeekNumbers';
import Icon from '../icon/Icon';

const MiniCalendar = ({
    hasCursors = true,
    now = new Date(),
    date: selectedDate,
    min,
    max,
    dateRange,
    onSelectDate,
    onSelectDateRange,
    weekStartsOn = 1,
    weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    nextMonth = 'Next month',
    prevMonth = 'Prev month',
    formatDay,
    markers = {},
    months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    numberOfDays = 7,
    numberOfWeeks = 6,
    displayWeekNumbers = false,
    displayedOnDarkBackground = false
}) => {
    const [temporaryDate, setTemporaryDate] = useState();

    const activeDate = temporaryDate || selectedDate;

    const days = useMemo(() => {
        return getDaysInMonth(activeDate, { weekStartsOn, weeks: numberOfWeeks - 1 });
    }, [activeDate, weekStartsOn, numberOfWeeks]);

    const monthLabel = useMemo(() => {
        return `${months[activeDate.getMonth()]} ${activeDate.getFullYear()}`;
    }, [activeDate, months]);

    const handleSwitchMonth = (direction) => {
        setTemporaryDate(addMonths(activeDate, direction));
    };

    useEffect(() => {
        setTemporaryDate();
    }, [selectedDate]);

    const classWeekNumber = displayWeekNumbers ? 'minicalendar-grid--displayWeekNumber' : '';
    const classDark = displayedOnDarkBackground ? 'minicalendar--onDarkBackground' : '';

    const preventLeaveFocus = (e) => e.preventDefault();

    return (
        <div
            className={classnames(['minicalendar', classDark])}
            onMouseDown={preventLeaveFocus}
            aria-label={monthLabel}
        >
            <div className="flex flex-items-center p1">
                {hasCursors ? (
                    <>
                        <button
                            type="button"
                            title={prevMonth}
                            className="flex ml0-5 mr0-5"
                            onClick={() => handleSwitchMonth(-1)}
                        >
                            <Icon name="caret" size={12} className="rotateZ-90 minicalendar-icon" />
                            <span className="sr-only">{prevMonth}</span>
                        </button>
                    </>
                ) : null}
                <span className="bold flex-item-fluid aligncenter ellipsis">{monthLabel}</span>
                {hasCursors ? (
                    <>
                        <button
                            type="button"
                            title={nextMonth}
                            className="flex ml0-5 mr0-5"
                            onClick={() => handleSwitchMonth(1)}
                        >
                            <Icon name="caret" size={12} className="rotateZ-270 minicalendar-icon" />
                            <span className="sr-only">{nextMonth}</span>
                        </button>
                    </>
                ) : null}
            </div>
            <div className={classnames(['minicalendar-grid pl0-75 pr0-75 pb1', classWeekNumber])}>
                {displayWeekNumbers ? (
                    <WeekNumbers weekStartsOn={weekStartsOn} numberOfWeeks={numberOfWeeks} days={days} />
                ) : null}
                <div>
                    <WeekDays
                        numberOfDays={numberOfDays}
                        weekdaysShort={weekdaysShort}
                        weekdaysLong={weekdaysLong}
                        weekStartsOn={weekStartsOn}
                    />
                    <MonthDays
                        min={min}
                        max={max}
                        markers={markers}
                        numberOfWeeks={numberOfWeeks}
                        numberOfDays={numberOfDays}
                        days={days}
                        formatDay={formatDay}
                        dateRange={dateRange}
                        onSelectDate={onSelectDate}
                        onSelectDateRange={onSelectDateRange}
                        now={now}
                        activeDate={activeDate}
                        selectedDate={selectedDate}
                    />
                </div>
            </div>
        </div>
    );
};

MiniCalendar.propTypes = {
    hasCursors: PropTypes.bool,
    markers: PropTypes.object,
    date: PropTypes.instanceOf(Date).isRequired,
    min: PropTypes.instanceOf(Date),
    max: PropTypes.instanceOf(Date),
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    dateFnLocale: PropTypes.object.isRequired,
    nextMonth: PropTypes.string.isRequired,
    prevMonth: PropTypes.string.isRequired,
    onSelectDate: PropTypes.func.isRequired,
    onSelectDateRange: PropTypes.func,
    formatDay: PropTypes.func,
    weekStartsOn: PropTypes.number,
    numberOfDays: PropTypes.number,
    numberOfWeeks: PropTypes.number,
    weekdaysShort: PropTypes.array,
    weekdaysLong: PropTypes.array,
    months: PropTypes.array,
    now: PropTypes.instanceOf(Date),
    displayWeekNumbers: PropTypes.bool,
    displayedOnDarkBackground: PropTypes.bool
};

export default MiniCalendar;
