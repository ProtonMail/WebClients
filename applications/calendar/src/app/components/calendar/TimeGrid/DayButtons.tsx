import { isSameDay } from '@proton/shared/lib/date-fns-utc';

interface Props {
    days: Date[];
    now: Date;
    date: Date;
    onClickDate?: (value: Date) => void;
    weekdaysLong: string[];
}
const DayButtons = ({ days, now, date, onClickDate, weekdaysLong }: Props) => {
    const result = days.map((day) => {
        return (
            <button
                className="flex-item-fluid text-center calendar-grid-heading p0-5"
                type="button"
                key={day.getUTCDate()}
                aria-current={isSameDay(day, now) ? 'date' : undefined}
                aria-pressed={isSameDay(day, date) ? true : undefined}
                onClick={() => onClickDate?.(day)}
            >
                <span className="calendar-grid-heading-day text-ellipsis block mt0 mb0 text-md">
                    <span className="calendar-grid-heading-day-fullname">{weekdaysLong[day.getUTCDay()]}</span>

                    <span className="calendar-grid-heading-day-shortname no-desktop no-tablet" aria-hidden="true">
                        {weekdaysLong[day.getUTCDay()][0]}
                    </span>
                </span>

                <span className="calendar-grid-heading-number">
                    <span className="mauto">{day.getUTCDate()}</span>
                </span>
            </button>
        );
    });

    return <>{result}</>;
};

export default DayButtons;
