import React from 'react';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';

const DayButtons = ({ days, now, date, formattedDates, onClickDate }) => {
    return days.map((day, dayIndex) => {
        return (
            <button
                type="button"
                aria-label={formattedDates[dayIndex]}
                className="flex-item-fluid aligncenter calendar-monthgrid-day p0-25"
                key={day.getUTCDate()}
                aria-current={isSameDay(day, now) ? 'date' : undefined}
                aria-pressed={isSameDay(day, date) ? true : undefined}
                onClick={() => onClickDate(day)}
            >
                <span className="calendar-monthgrid-day-number flex mauto">
                    <span className="mauto">{day.getUTCDate()}</span>
                </span>
            </button>
        );
    });
};

export default React.memo(DayButtons);
