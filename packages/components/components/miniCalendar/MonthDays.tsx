import type { MouseEvent, Ref } from 'react';
import { memo, useRef, useState } from 'react';

import { isAfter, isBefore, isSameDay, isSameMonth, isWithinInterval } from 'date-fns';

import clsx from '@proton/utils/clsx';

import type { DateTuple } from './interface';

const getTargetDate = (target: any, days: Date[]) => {
    const idx = parseInt(target?.dataset?.i || '', 10);
    if (idx >= 0 && idx < days.length) {
        return days[idx];
    }
};

export interface Props {
    days: Date[];
    onSelectDate?: (a1: Date) => void;
    onSelectDateRange?: (a1: DateTuple) => void;
    now: Date;
    selectedDate?: Date;
    activeDate: Date;
    dateRange?: DateTuple;
    min?: Date;
    max?: Date;
    formatDay: (a1: Date) => string;
    numberOfDays: number;
    numberOfWeeks: number;
    cellRef?: Ref<HTMLLIElement>;
}

const MonthDays = ({
    days,
    onSelectDate,
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
    cellRef,
}: Props) => {
    const [temporaryDateRange, setTemporaryDateRange] = useState<[Date, Date | undefined] | undefined>(undefined);
    const rangeStartRef = useRef<Date | undefined>(undefined);
    const rangeEndRef = useRef<Date | undefined>(undefined);

    const style = {
        '--cols': numberOfDays,
        '--rows': numberOfWeeks,
    };

    const handleMouseDown = ({ target }: MouseEvent<HTMLUListElement>) => {
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

    const handleMouseOver = ({ target }: MouseEvent<HTMLUListElement>) => {
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

    const handleClick = ({ target }: MouseEvent<HTMLUListElement>) => {
        const value = getTargetDate(target, days);
        if (value) {
            onSelectDate?.(value);
        }
    };

    const [rangeStart, rangeEnd] = temporaryDateRange || dateRange || [];

    return (
        <ul
            className="minicalendar-monthdays unstyled m-0 text-center"
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
                const isPressed = selectedDate ? isSameDay(selectedDate, dayDate) || isInterval : false;

                // only for CSS layout: start/end of week OR start/end of interval in week
                const isIntervalBoundStart =
                    (isInterval && i % numberOfDays === 0) ||
                    (isInterval && rangeStart && isSameDay(rangeStart, dayDate));
                const isIntervalBoundEnd =
                    (isInterval && i % numberOfDays === numberOfDays - 1) ||
                    (isInterval && rangeEnd && isSameDay(rangeEnd, dayDate)) ||
                    (!rangeEnd && isIntervalBoundStart);

                const className = clsx([
                    'minicalendar-day *:pointer-events-none',
                    !isActiveMonth && 'minicalendar-day--out-of-month',
                    isInterval && 'minicalendar-day--range',
                    isIntervalBoundStart && 'minicalendar-day--range-bound-start',
                    isIntervalBoundEnd && 'minicalendar-day--range-bound-end',
                    selectedDate && isSameDay(selectedDate, dayDate) && 'minicalendar-day--selected',
                ]);

                return (
                    <li key={dayDate.toString()} ref={i === 0 ? cellRef : undefined}>
                        <button
                            disabled={isOutsideMinMax}
                            aria-label={formatDay(dayDate)}
                            aria-current={isCurrent ? 'date' : undefined}
                            aria-pressed={isPressed ? true : undefined}
                            className={className}
                            data-i={i}
                            type="button"
                        >
                            <span className="minicalendar-day-number">{dayDate.getDate()}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default memo(MonthDays);
