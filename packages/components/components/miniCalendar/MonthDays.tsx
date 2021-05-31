import { isBefore, isAfter, isSameDay, isSameMonth, isWithinInterval } from 'date-fns';
import React, { useState, useRef } from 'react';

import { classnames } from '../../helpers';
import { DateTuple } from './index.d';

const getTargetDate = (target: any, days: Date[]) => {
    const idx = parseInt(target?.dataset?.i || '', 10);
    if (idx >= 0 && idx < days.length) {
        return days[idx];
    }
};

export interface Props {
    days: Date[];
    markers: { [ts: string]: boolean };
    onSelectDate: (a1: Date) => void;
    onSelectDateRange: (a1: DateTuple) => void;
    now: Date;
    selectedDate?: Date;
    activeDate: Date;
    dateRange?: DateTuple;
    min?: Date;
    max?: Date;
    formatDay: (a1: Date) => string;
    numberOfDays: number;
    numberOfWeeks: number;
}

const MonthDays = ({
    days,
    onSelectDate,
    markers = {},
    onSelectDateRange,
    dateRange,
    formatDay,
    now,
    min,
    max,
    selectedDate,
    activeDate,
    numberOfDays,
    numberOfWeeks,
}: Props) => {
    const [temporaryDateRange, setTemporaryDateRange] = useState<[Date, Date | undefined] | undefined>(undefined);
    const rangeStartRef = useRef<Date | undefined>(undefined);
    const rangeEndRef = useRef<Date | undefined>(undefined);

    const style = {
        '--minicalendar-days-numberOfDays': numberOfDays,
        '--minicalendar-days-numberOfWeeks': numberOfWeeks,
    };

    const handleMouseDown = ({ target }: React.MouseEvent<HTMLUListElement>) => {
        const targetDate = getTargetDate(target, days);
        if (rangeStartRef.current || !targetDate || !onSelectDateRange) {
            return;
        }

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

            setTemporaryDateRange(undefined);
            rangeStartRef.current = undefined;
            rangeEndRef.current = undefined;

            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseOver = ({ target }: React.MouseEvent<HTMLUListElement>) => {
        const overDate = getTargetDate(target, days);
        if (!rangeStartRef.current || !overDate || !onSelectDateRange) {
            return;
        }
        rangeEndRef.current = overDate;

        setTemporaryDateRange(
            isAfter(overDate, rangeStartRef.current)
                ? [rangeStartRef.current, overDate]
                : [overDate, rangeStartRef.current]
        );
    };

    const handleFocus = () => {};

    const handleClick = ({ target }: React.MouseEvent<HTMLUListElement>) => {
        const value = getTargetDate(target, days);
        if (value) {
            onSelectDate(value);
        }
    };

    const [rangeStart, rangeEnd] = temporaryDateRange || dateRange || [];

    return (
        <ul
            className="unstyled m0 text-center minicalendar-days"
            style={style}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseOver={handleMouseOver}
            onFocus={handleFocus}
        >
            {days.map((dayDate, i) => {
                const isBeforeMin = min ? isBefore(dayDate, min) : false;
                const isAfterMax = max ? isAfter(dayDate, max) : false;
                const isOutsideMinMax = isBeforeMin || isAfterMax;
                const isActiveMonth = isOutsideMinMax ? false : isSameMonth(dayDate, activeDate);
                const isCurrent = isSameDay(now, dayDate);
                const isInterval =
                    (rangeStart && rangeEnd && isWithinInterval(dayDate, { start: rangeStart, end: rangeEnd })) ||
                    (rangeStart && isSameDay(rangeStart, dayDate));
                const isIntervalBound =
                    rangeStart && rangeEnd ? isSameDay(rangeStart, dayDate) || isSameDay(rangeEnd, dayDate) : false;
                const isPressed = selectedDate ? isSameDay(selectedDate, dayDate) || isInterval : false;

                // only for CSS layout: beginning/end of week OR beginning/end of interval in week
                const isIntervalBoundBegin =
                    (isInterval && i % numberOfDays === 0) ||
                    (isInterval && rangeStart && isSameDay(rangeStart, dayDate));
                const isIntervalBoundEnd =
                    (isInterval && i % numberOfDays === numberOfDays - 1) ||
                    (isInterval && rangeEnd && isSameDay(rangeEnd, dayDate)) ||
                    (!rangeEnd && isIntervalBoundBegin);

                const hasMarker = markers[dayDate.getTime()];

                const className = classnames([
                    'minicalendar-day no-pointer-events-children',
                    !isActiveMonth && 'minicalendar-day--inactive-month',
                    isIntervalBound && 'minicalendar-day--range-bound',
                    isIntervalBoundBegin && 'minicalendar-day--range-bound-begin',
                    isIntervalBoundEnd && 'minicalendar-day--range-bound-end',
                    isInterval && 'minicalendar-day--range',
                    selectedDate && isSameDay(selectedDate, dayDate) && 'minicalendar-day--selected',
                ]);

                return (
                    <li key={dayDate.toString()}>
                        <button
                            disabled={isOutsideMinMax}
                            aria-label={formatDay(dayDate)}
                            aria-current={isCurrent ? 'date' : undefined}
                            aria-pressed={isPressed ? true : undefined}
                            className={className}
                            data-i={i}
                            data-current-day={dayDate.getDate()}
                            type="button"
                        >
                            <span className="minicalendar-day-inner">{dayDate.getDate()}</span>
                            {hasMarker ? <span className="minicalendar-day--marker" /> : null}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default React.memo(MonthDays);
