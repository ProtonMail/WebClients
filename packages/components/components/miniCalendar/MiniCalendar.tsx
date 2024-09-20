import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { addMonths, endOfMonth, isSameMonth, startOfMonth } from 'date-fns';
import { c } from 'ttag';

import { Button, Vr } from '@proton/atoms';
import TodayIcon from '@proton/components/components/icon/TodayIcon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import clsx from '@proton/utils/clsx';

import { createObserver } from '../../hooks/useElementRect';
import Icon from '../icon/Icon';
import MonthDays from './MonthDays';
import WeekDays from './WeekDays';
import WeekNumbers from './WeekNumbers';
import { getDateTupleFromMonday, getDaysInMonth } from './helper';
import type { DateTuple } from './interface';

export interface Props {
    hasCursors?: boolean;
    hasToday?: boolean;
    now?: Date;
    date: Date;
    dateRange?: DateTuple;
    min?: Date;
    max?: Date;
    displayWeekNumbers?: boolean;
    months?: string[];
    nextMonth?: string;
    prevMonth?: string;
    numberOfWeeks?: number;
    weekdaysLong?: string[];
    weekdaysShort?: string[];
    onSelectDate?: (a1: Date) => void;
    onSelectDateRange?: (a1: DateTuple, resetRange?: boolean) => void;
    formatDay?: (a1: Date) => string;
    weekStartsOn?: WeekStartsOn;
    numberOfDays?: number;
    fixedSize?: boolean;
    preventLeaveFocus?: boolean;
    todayTitle?: string;
}

const MiniCalendar = ({
    hasCursors = true,
    hasToday = false,
    now = new Date(),
    date: selectedDate,
    min,
    max,
    dateRange,
    onSelectDate,
    onSelectDateRange,
    formatDay = (date) => date.toString(),
    weekStartsOn = 1,
    weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    nextMonth = 'Next month',
    prevMonth = 'Previous month',
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
        'December',
    ],
    numberOfDays = 7,
    numberOfWeeks = 6,
    displayWeekNumbers = false,
    fixedSize = false,
    preventLeaveFocus = false,
    todayTitle,
}: Props) => {
    const [temporaryDate, setTemporaryDate] = useState<Date | undefined>();
    const [cellWidth, setCellWidth] = useState(0);
    const unsubscribeRef = useRef<() => void | undefined>();

    useEffect(() => {
        return () => {
            unsubscribeRef.current?.();
        };
    }, []);

    const cb = useCallback((node: HTMLElement | null) => {
        unsubscribeRef.current?.();
        if (!node) {
            return null;
        }
        const sizeCache: number[] = [];
        unsubscribeRef.current = createObserver(node, (rect) => {
            const [prevOld, prevNew] = sizeCache;
            const newWidth = rect.width;
            // If it's flipping back and forth, settle on the previous value. This is
            // to prevent a scenario where the new height of the node causes an overflow scroll to
            // appear/disappear indefinitely.
            if (prevOld === newWidth) {
                return;
            }
            setCellWidth(newWidth);
            sizeCache[0] = prevNew;
            sizeCache[1] = newWidth;
        });
    }, []);

    const activeDate = temporaryDate || selectedDate;
    const activeDateDay = isSameMonth(now, activeDate) ? now.getDay() : undefined;

    const days = useMemo(() => {
        return getDaysInMonth(activeDate, { weekStartsOn, weeks: numberOfWeeks - 1 });
    }, [activeDate, weekStartsOn, numberOfWeeks]);

    const monthLabel = useMemo(() => {
        return `${months[activeDate.getMonth()]} ${activeDate.getFullYear()}`;
    }, [activeDate, months]);

    const handleSwitchMonth = (direction: -1 | 1) => {
        const newDate = addMonths(activeDate, direction);

        // Don't allow to go outside of bounds.
        const isBeforeMin = min && startOfMonth(newDate) < startOfMonth(min);
        const isAfterMax = max && endOfMonth(newDate) > endOfMonth(max);
        if (isBeforeMin || isAfterMax) {
            return;
        }

        setTemporaryDate(newDate);
    };

    const handleClickWeekNumber =
        onSelectDateRange &&
        ((monday: Date) => {
            onSelectDateRange(getDateTupleFromMonday(monday, weekStartsOn), true);
        });

    const handleSelectWeekRange =
        onSelectDateRange &&
        (([startWeekMonday, endWeekMonday]: [Date, Date]) => {
            const [start] = getDateTupleFromMonday(startWeekMonday, weekStartsOn);
            const [, end] = getDateTupleFromMonday(endWeekMonday, weekStartsOn);
            onSelectDateRange([start, end]);
        });

    useEffect(() => {
        setTemporaryDate(undefined);
    }, [selectedDate]);

    const handleMouseDown = preventLeaveFocus ? (e: FormEvent<HTMLElement>) => e.preventDefault() : undefined;

    return (
        <div className="minicalendar" onMouseDown={handleMouseDown} aria-label={monthLabel}>
            <h2 className="sr-only">{c('Title').t`Minicalendar`}</h2>
            <div className="flex items-center flex-nowrap p-3 pt-1">
                <span className="text-bold flex-1 text-ellipsis">{monthLabel}</span>

                {hasToday ? (
                    <Tooltip title={todayTitle}>
                        <Button
                            icon
                            shape="ghost"
                            color="weak"
                            size="small"
                            onClick={() => onSelectDate?.(now)}
                            disabled={(min && +now < +min) || (max && +now > +max)}
                            data-testid="minicalendar:today"
                            className="flex"
                        >
                            <TodayIcon todayDate={now.getDate()} />
                        </Button>
                    </Tooltip>
                ) : null}

                {hasCursors ? (
                    <>
                        <Tooltip title={prevMonth}>
                            <Button
                                icon
                                shape="ghost"
                                className="rtl:mirror"
                                color="weak"
                                size="small"
                                disabled={min && startOfMonth(addMonths(activeDate, -1)) < startOfMonth(min)}
                                onClick={() => handleSwitchMonth(-1)}
                                data-testid="minicalendar:previous-month"
                            >
                                <Icon name="chevron-left" className="minicalendar-icon" alt={prevMonth} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={nextMonth}>
                            <Button
                                icon
                                shape="ghost"
                                className="rtl:mirror"
                                color="weak"
                                size="small"
                                disabled={max && endOfMonth(addMonths(activeDate, 1)) > endOfMonth(max)}
                                onClick={() => handleSwitchMonth(1)}
                                data-testid="minicalendar:next-month"
                            >
                                <Icon name="chevron-right" className="minicalendar-icon" alt={nextMonth} />
                            </Button>
                        </Tooltip>
                    </>
                ) : null}
            </div>

            <div
                style={
                    !fixedSize && cellWidth && cellWidth > 0 ? { '--computed-cell-width': `${cellWidth}px` } : undefined
                }
                className={clsx([
                    'minicalendar-grid px-3 pb-7',
                    displayWeekNumbers && 'with-weeknumbers',
                    fixedSize && 'is-fixed-size',
                ])}
            >
                {displayWeekNumbers ? (
                    <>
                        <WeekNumbers
                            numberOfWeeks={numberOfWeeks}
                            days={days}
                            onClickWeekNumber={handleClickWeekNumber}
                            onSelectWeekRange={handleSelectWeekRange}
                        />
                        <Vr className="minicalendar-vr" aria-hidden="true" />
                    </>
                ) : null}

                <WeekDays
                    numberOfDays={numberOfDays}
                    weekdaysShort={weekdaysShort}
                    weekdaysLong={weekdaysLong}
                    weekStartsOn={weekStartsOn}
                    activeDateDay={activeDateDay}
                    cellRef={cb}
                />

                <MonthDays
                    min={min}
                    max={max}
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
    );
};

export default MiniCalendar;
