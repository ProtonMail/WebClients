import React from 'react';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';

interface Props {
    days: Date[];
    now: Date;
    date: Date;
    formattedDates: string[];
    onClickDate: (day: Date) => void;
}
const DayButtons = ({ days, now, date, formattedDates, onClickDate }: Props) => {
    return (
        <>
            {days.map((day, dayIndex) => {
                return (
                    <button
                        type="button"
                        aria-label={formattedDates[dayIndex]}
                        className="flex-item-fluid text-center calendar-monthgrid-day p0-25"
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
            })}
        </>
    );
};

const MemoedDayButtons = React.memo(DayButtons);

export default MemoedDayButtons;
