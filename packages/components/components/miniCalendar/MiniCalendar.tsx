import React, { useMemo, useState, useEffect, FormEvent } from 'react';
import { addMonths, endOfMonth, startOfMonth } from 'date-fns';
import { isSameMonth } from 'proton-shared/lib/date-fns-utc';
import { noop } from 'proton-shared/lib/helpers/function';

import { getDaysInMonth } from './helper';
import { classnames } from '../../helpers';
import MonthDays from './MonthDays';
import WeekDays from './WeekDays';
import WeekNumbers from './WeekNumbers';
import Icon from '../icon/Icon';
import { DateTuple, WeekStartsOn } from './index.d';
import { Button } from '../button';

export interface Props {
    hasCursors?: boolean;
    now?: Date;
    date: Date;
    dateRange?: DateTuple;
    min?: Date;
    max?: Date;
    markers?: { [ts: number]: boolean };
    displayWeekNumbers?: boolean;
    displayedOnDarkBackground?: boolean;
    months?: string[];
    nextMonth?: string;
    prevMonth?: string;
    numberOfWeeks?: number;
    weekdaysLong?: string[];
    weekdaysShort?: string[];
    onSelectDate?: (a1: Date) => void;
    onSelectDateRange?: (a1: DateTuple) => void;
    formatDay?: (a1: Date) => string;
    weekStartsOn?: WeekStartsOn;
    numberOfDays?: number;
}

const MiniCalendar = ({
    hasCursors = true,
    now = new Date(),
    date: selectedDate,
    min,
    max,
    dateRange,
    onSelectDate = noop,
    onSelectDateRange = noop,
    formatDay = (date) => date.toString(),
    weekStartsOn = 1,
    weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    nextMonth = 'Next month',
    prevMonth = 'Previous month',
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
        'December',
    ],
    numberOfDays = 7,
    numberOfWeeks = 6,
    displayWeekNumbers = false,
    displayedOnDarkBackground = false,
}: Props) => {
    const [temporaryDate, setTemporaryDate] = useState<Date | undefined>();

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

    useEffect(() => {
        setTemporaryDate(undefined);
    }, [selectedDate]);

    const classWeekNumber = displayWeekNumbers ? 'minicalendar-grid--display-week-number' : '';
    const classDark = displayedOnDarkBackground ? 'minicalendar--on-dark-background' : '';

    const preventLeaveFocus = (e: FormEvent<HTMLElement>) => e.preventDefault();

    return (
        <div
            className={classnames(['minicalendar', classDark])}
            onMouseDown={preventLeaveFocus}
            aria-label={monthLabel}
        >
            <div className="flex flex-align-items-center flex-nowrap p1">
                <span className="text-bold flex-item-fluid text-ellipsis">{monthLabel}</span>
                {hasCursors ? (
                    <>
                        <Button icon shape="ghost" color="weak" title={prevMonth} onClick={() => handleSwitchMonth(-1)}>
                            <Icon name="caret" className="rotateZ-90 minicalendar-icon" />
                            <span className="sr-only">{prevMonth}</span>
                        </Button>
                        <Button icon shape="ghost" color="weak" title={nextMonth} onClick={() => handleSwitchMonth(1)}>
                            <Icon name="caret" className="rotateZ-270 minicalendar-icon" />
                            <span className="sr-only">{nextMonth}</span>
                        </Button>
                    </>
                ) : null}
            </div>
            <div className={classnames(['minicalendar-grid pl0-75 pr0-75 pb1', classWeekNumber])}>
                {displayWeekNumbers ? <WeekNumbers numberOfWeeks={numberOfWeeks} days={days} /> : null}
                <div>
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

export default MiniCalendar;
