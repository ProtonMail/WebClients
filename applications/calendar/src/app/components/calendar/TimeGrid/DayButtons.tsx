import { isSameDay } from '@proton/shared/lib/date-fns-utc';
import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

interface Props {
    days: Date[];
    now: Date;
    date: Date;
    onClickDate?: (value: Date) => void;
    weekdays: string[];
    weekdaysSingle: string[];
    hasSmallLabels?: boolean;
    hasBoldLabels?: boolean;
}
const DayButtons = ({
    days,
    now,
    date,
    onClickDate,
    weekdays,
    weekdaysSingle,
    hasSmallLabels = false,
    hasBoldLabels = false,
}: Props) => {
    const result = days.map((day) => {
        const eventFullDetail = formatUTC(day, 'PPPP', { locale: dateLocale });

        return (
            <button
                className="flex-1 justify-center calendar-grid-heading flex items-center p-2 text-lg"
                type="button"
                key={day.getUTCDate()}
                aria-current={isSameDay(day, now) ? 'date' : undefined}
                aria-pressed={isSameDay(day, date) ? true : undefined}
                onClick={() => onClickDate?.(day)}
                title={eventFullDetail}
                aria-label={eventFullDetail}
            >
                <span className="calendar-grid-heading-day color-weak">
                    <span className="calendar-grid-heading-day-fullname">{weekdays[day.getUTCDay()]}</span>

                    <span
                        className={clsx([
                            'calendar-grid-heading-day-shortname md:hidden',
                            hasSmallLabels && 'text-xs',
                            hasBoldLabels && 'text-strong',
                        ])}
                        aria-hidden="true"
                    >
                        {weekdaysSingle[day.getUTCDay()]}
                    </span>
                </span>
                <span className="calendar-grid-heading-number inline-flex justify-center items-center color-norm shrink-0">
                    {day.getUTCDate()}
                </span>
            </button>
        );
    });

    return <>{result}</>;
};

export default DayButtons;
