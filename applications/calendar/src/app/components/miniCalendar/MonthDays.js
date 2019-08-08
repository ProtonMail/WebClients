import { isAfter, isSameDay, isSameMonth, isWithinRange } from 'date-fns';
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const getDayStyle = ({ isActiveMonth, selectedDate, now, dayDate, range }) => {
    const color = (() => {
        if (isSameDay(now, dayDate)) {
            return 'red';
        }
        if (isSameDay(selectedDate, dayDate)) {
            return 'green';
        }
    })();

    const rangeStyle = (() => {
        if (!range) {
            return {};
        }
        const [rangeStart, rangeEnd] = range;
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
        ...rangeStyle
    };
};

const MonthDays = ({
    days,
    onSelectDate,
    onSelectDateRange,
    dateRange,
    now,
    selectedDate,
    activeDate,
    numberOfDays,
    numberOfWeeks,
    gridSize
}) => {
    const [temporaryDateRange, setTemporaryDateRange] = useState();
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

        if (rangeStartRef.current) {
            return;
        }

        const targetDate = getDate(target);

        setTemporaryDateRange([targetDate, undefined]);
        rangeStartRef.current = targetDate;

        const handleMouseUp = () => {
            if (rangeEndRef.current && rangeStartRef.current) {
                onSelectDateRange(
                    isAfter(rangeEndRef.current, rangeStartRef.current)
                        ? [rangeStartRef.current, rangeEndRef.current]
                        : [rangeEndRef.current, rangeStartRef.current]
                );
            }

            setTemporaryDateRange();
            rangeStartRef.current = undefined;
            rangeEndRef.current = undefined;

            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseOver = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }

        if (!rangeStartRef.current) {
            return;
        }

        const overDate = getDate(target);
        rangeEndRef.current = overDate;

        setTemporaryDateRange(
            isAfter(overDate, rangeStartRef.current)
                ? [rangeStartRef.current, overDate]
                : [overDate, rangeStartRef.current]
        );
    };

    const handleClick = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }
        onSelectDate(getDate(target));
    };

    return (
        <div
            style={style}
            onClick={handleClick}
            onMouseDown={onSelectDateRange ? handleMouseDown : null}
            onMouseOver={onSelectDateRange ? handleMouseOver : null}
        >
            {days.map((dayDate, i) => {
                const isActiveMonth = isSameMonth(dayDate, activeDate);
                return (
                    <span
                        key={dayDate.toString()}
                        style={getDayStyle({
                            isActiveMonth,
                            selectedDate,
                            now,
                            dayDate,
                            range: temporaryDateRange || dateRange || undefined
                        })}
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
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    onSelectDate: PropTypes.func.isRequired,
    onSelectDateRange: PropTypes.func,
    numberOfDays: PropTypes.number.isRequired,
    numberOfWeeks: PropTypes.number.isRequired,
    gridSize: PropTypes.string,
    now: PropTypes.instanceOf(Date),
    selectedDate: PropTypes.instanceOf(Date),
    activeDate: PropTypes.instanceOf(Date)
};

export default MonthDays;
