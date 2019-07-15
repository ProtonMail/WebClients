import { isAfter, isSameDay, isSameMonth, isWithinRange } from 'date-fns';
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const getDayStyle = ({ isActiveMonth, selectedDate, now, dayDate, rangeStart, rangeEnd }) => {
    const color = (() => {
        if (isSameDay(now, dayDate)) {
            return 'red';
        }
        if (isSameDay(selectedDate, dayDate)) {
            return 'green';
        }
    })();

    const range = (() => {
        if (!rangeStart || !rangeEnd) {
            return {};
        }
        if (isSameDay(rangeStart, dayDate) || isSameDay(rangeEnd, dayDate)) {
            return {
                background: 'blue'
            };
        }
        if (isWithinRange(dayDate, rangeStart, rangeEnd)) {
            return {
                background: 'blue',
                opacity: '0.5'
            };
        }
        return {};
    })();

    return {
        cursor: 'pointer',
        opacity: !isActiveMonth ? '0.3' : '1',
        color,
        ...range
    };
};

const MonthDays = ({
    days,
    onSelectDate,
    onSelectDateRange,
    now,
    selectedDate,
    activeDate,
    numberOfDays,
    numberOfWeeks,
    gridSize
}) => {
    const [rangeStart, setRangeStart] = useState();
    const [rangeEnd, setRangeEnd] = useState();
    const rangeStartRef = useRef();
    const rangeEndRef = useRef();

    const style = {
        display: 'grid',
        'grid-template-columns': `repeat(${numberOfDays}, ${gridSize})`,
        'grid-template-rows': `repeat(${numberOfWeeks}, ${gridSize})`,
        textAlign: 'center',
        userSelect: 'none'
    };

    const getDate = (el) => {
        return days[el.dataset.i];
    };

    const handleMouseDown = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }

        if (rangeStart) {
            return;
        }

        const targetDate = getDate(target);
        setRangeStart(targetDate);
        rangeStartRef.current = targetDate;

        const handleMouseUp = () => {
            document.removeEventListener('mouseup', handleMouseUp);

            setRangeStart();
            setRangeEnd();

            if (rangeEndRef.current && rangeStartRef.current) {
                if (isAfter(rangeEndRef.current, rangeStartRef.current)) {
                    return onSelectDateRange(rangeStartRef.current, rangeEndRef.current);
                }
                onSelectDateRange(rangeEndRef.current, rangeStartRef.current);
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseOver = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }
        if (!rangeStart) {
            return;
        }

        const overDate = getDate(target);
        rangeEndRef.current = overDate;

        if (isAfter(overDate, rangeStartRef.current)) {
            setRangeStart(rangeStartRef.current);
            setRangeEnd(overDate);
            return;
        }

        setRangeStart(overDate);
        setRangeEnd(rangeStartRef.current);
    };

    const handleClick = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }
        onSelectDate(getDate(target));
    };

    return (
        <div style={style} onClick={handleClick} onMouseDown={handleMouseDown} onMouseOver={handleMouseOver}>
            {days.map((dayDate, i) => {
                const isActiveMonth = isSameMonth(dayDate, activeDate);
                return (
                    <span
                        key={dayDate.toString()}
                        style={getDayStyle({ isActiveMonth, selectedDate, now, dayDate, rangeStart, rangeEnd })}
                        data-i={i}
                    >
                        {dayDate.getDate()}
                    </span>
                );
            })}
        </div>
    );
};

MonthDays.propTypes = {
    days: PropTypes.array.isRequired,
    onSelectDate: PropTypes.func.isRequired,
    onSelectDateRange: PropTypes.func.isRequired,
    numberOfDays: PropTypes.number.isRequired,
    numberOfWeeks: PropTypes.number.isRequired,
    gridSize: PropTypes.string,
    now: PropTypes.instanceOf(Date),
    selectedDate: PropTypes.instanceOf(Date),
    activeDate: PropTypes.instanceOf(Date)
};

export default MonthDays;
