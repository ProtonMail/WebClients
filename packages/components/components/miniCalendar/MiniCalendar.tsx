import { useMemo, useState, useEffect, FormEvent, useRef } from 'react';
import { addMonths, endOfMonth, startOfMonth, isSameMonth } from 'date-fns';
import { c } from 'ttag';

import { useElementRect } from '../../hooks';
import { getDaysInMonth, getDateTupleFromMonday } from './helper';
import { classnames } from '../../helpers';
import MonthDays from './MonthDays';
import WeekDays from './WeekDays';
import WeekNumbers from './WeekNumbers';
import Icon from '../icon/Icon';
import { DateTuple, WeekStartsOn } from './index.d';
import { Button } from '../button';
import { Tooltip } from '../tooltip';
import { Vr } from '../vr';

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
}: Props) => {
    const [temporaryDate, setTemporaryDate] = useState<Date | undefined>();
    const cellRef = useRef<HTMLLIElement>(null);
    const cellRect = useElementRect(cellRef);

    const activeDate = temporaryDate || selectedDate;
    const activeDateDay = isSameMonth(now, activeDate) ? now.getDay() : undefined;

    const days = useMemo(() => {
        return getDaysInMonth(activeDate, { weekStartsOn, weeks: numberOfWeeks - 1 });
    }, [activeDate, weekStartsOn, numberOfWeeks]);

    const monthLabel = useMemo(() => {
        return `${months[activeDate.getMonth()]} ${activeDate.getFullYear()}`;
    }, [activeDate, months]);

    const todayTitle = c('Today icon tooltip in mini calendar').t`Today`;

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
            <div className="flex flex-align-items-center flex-nowrap p1">
                <span className="text-bold flex-item-fluid text-ellipsis">{monthLabel}</span>

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
                        >
                            <Icon name="calendar-day" className="minicalendar-icon" alt={todayTitle} />
                        </Button>
                    </Tooltip>
                ) : null}

                {hasCursors ? (
                    <>
                        <Tooltip title={prevMonth}>
                            <Button
                                icon
                                shape="ghost"
                                className="on-rtl-mirror"
                                color="weak"
                                size="small"
                                disabled={min && startOfMonth(addMonths(activeDate, -1)) < startOfMonth(min)}
                                onClick={() => handleSwitchMonth(-1)}
                                data-testid="minicalendar:previous-month"
                            >
                                <Icon name="angle-down" className="rotateZ-90 minicalendar-icon" alt={prevMonth} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={nextMonth}>
                            <Button
                                icon
                                shape="ghost"
                                className="on-rtl-mirror"
                                color="weak"
                                size="small"
                                disabled={max && endOfMonth(addMonths(activeDate, 1)) > endOfMonth(max)}
                                onClick={() => handleSwitchMonth(1)}
                                data-testid="minicalendar:next-month"
                            >
                                <Icon name="angle-down" className="rotateZ-270 minicalendar-icon" alt={nextMonth} />
                            </Button>
                        </Tooltip>
                    </>
                ) : null}
            </div>

            <div
                style={
                    !fixedSize && cellRect && cellRect.width > 0
                        ? { '--computed-cell-width': `${cellRect.width}px` }
                        : undefined
                }
                className={classnames([
                    'minicalendar-grid pl0-75 pr0-75 pb1',
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
                    cellRef={cellRef}
                />
            </div>
        </div>
    );
};

export default MiniCalendar;
