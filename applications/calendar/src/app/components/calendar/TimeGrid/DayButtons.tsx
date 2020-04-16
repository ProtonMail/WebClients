import { isSameDay } from 'proton-shared/lib/date-fns-utc';
import React from 'react';

interface Props {
    days: Date[];
    now: Date;
    date: Date;
    onClickDate: (value: Date) => void;
    weekdaysLong: string[];
}
const DayButtons = ({ days, now, date, onClickDate, weekdaysLong }: Props) => {
    return days.map((day) => {
        return (
            <button
                className="flex-item-fluid aligncenter calendar-grid-heading p0-5"
                type="button"
                key={day.getUTCDate()}
                aria-current={isSameDay(day, now) ? 'date' : undefined}
                aria-pressed={isSameDay(day, date) ? true : undefined}
                onClick={() => onClickDate(day)}
            >
                <span className="calendar-grid-heading-number mt0-25">
                    <span className="mauto">{day.getUTCDate()}</span>
                </span>

                <span className="calendar-grid-heading-day ellipsis bl mt0 mb0 big">
                    <span className="calendar-grid-heading-day-fullname">{weekdaysLong[day.getUTCDay()]}</span>

                    <span className="calendar-grid-heading-day-shortname nodesktop notablet" aria-hidden="true">
                        {weekdaysLong[day.getUTCDay()][0]}
                    </span>
                </span>
            </button>
        );
    });
};

export default DayButtons;
