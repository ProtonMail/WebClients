import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import { addMonths } from 'date-fns';

import { getDaysInMonth } from './helper';
import MonthDays from './MonthDays';
import WeekDays from './WeekDays';
import WeekNumbers from './WeekNumbers';

const MiniCalendar = ({
    now = new Date(),
    date: selectedDate,
    dateRange,
    onSelectDate,
    onSelectDateRange,
    weekStartsOn = 1,
    weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
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
    numberOfWeeks = 6,
    hasWeekNumbers = true
}) => {
    const [temporaryDate, setTemporaryDate] = useState();

    const activeDate = temporaryDate || selectedDate;

    const days = useMemo(() => {
        return getDaysInMonth(activeDate, { weekStartsOn, weeks: numberOfWeeks - 1 });
    }, [activeDate]);

    const monthLabel = useMemo(() => {
        return (
            <span className="pl0-5">
                {months[activeDate.getMonth()]} {activeDate.getFullYear()}
            </span>
        );
    }, [activeDate, months]);

    const handleSwitchMonth = (direction) => {
        setTemporaryDate(addMonths(activeDate, direction));
    };

    useEffect(() => {
        setTemporaryDate();
    }, [selectedDate]);

    const gridSize = '1fr';
    const style = hasWeekNumbers
        ? {
              display: 'grid',
              'grid-template-columns': '30px auto',
              'grid-template-rows': 'auto'
          }
        : {};

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <button onClick={() => handleSwitchMonth(-1)}>
                    <Icon color="white" name="arrow-left" />
                </button>
                <span>{monthLabel}</span>
                <button onClick={() => handleSwitchMonth(1)}>
                    <Icon color="white" name="arrow-right" />
                </button>
            </div>
            <div style={style}>
                {hasWeekNumbers ? <WeekNumbers gridSize={gridSize} numberOfWeeks={numberOfWeeks} days={days} /> : null}
                <div>
                    <WeekDays
                        gridSize={gridSize}
                        numberOfDays={weekdays.length}
                        weekdays={weekdays}
                        weekStartsOn={weekStartsOn}
                    />
                    <MonthDays
                        gridSize={gridSize}
                        numberOfWeeks={numberOfWeeks}
                        numberOfDays={weekdays.length}
                        days={days}
                        dateRange={dateRange}
                        onSelectDate={onSelectDate}
                        onSelectDateRange={onSelectDateRange}
                        now={now}
                        activeDate={activeDate}
                        selectedDate={selectedDate}
                    />
                </div>
            </div>
        </>
    );
};

MiniCalendar.propTypes = {
    date: PropTypes.instanceOf(Date).isRequired,
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    onSelectDate: PropTypes.func.isRequired,
    onSelectDateRange: PropTypes.func,
    weekStartsOn: PropTypes.number,
    numberOfWeeks: PropTypes.number,
    weekdays: PropTypes.array,
    months: PropTypes.array,
    now: PropTypes.instanceOf(Date),
    hasWeekNumbers: PropTypes.bool
};

export default MiniCalendar;
