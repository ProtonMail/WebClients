import { isSameDay } from '@proton/shared/lib/date-fns-utc';
import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';
import { classnames } from '@proton/components/helpers';

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
        return (
            <button
                className="flex-item-fluid flex-justify-center calendar-grid-heading flex flex-align-items-center p0-5 text-lg"
                type="button"
                key={day.getUTCDate()}
                aria-current={isSameDay(day, now) ? 'date' : undefined}
                aria-pressed={isSameDay(day, date) ? true : undefined}
                onClick={() => onClickDate?.(day)}
                title={formatUTC(day, 'PPPP', { locale: dateLocale })}
            >
                <span className="calendar-grid-heading-day color-weak">
                    <span className="calendar-grid-heading-day-fullname">{weekdays[day.getUTCDay()]}</span>

                    <span
                        className={classnames([
                            'calendar-grid-heading-day-shortname no-desktop no-tablet',
                            hasSmallLabels && 'text-xs',
                            hasBoldLabels && 'text-strong',
                        ])}
                        aria-hidden="true"
                    >
                        {weekdaysSingle[day.getUTCDay()]}
                    </span>
                </span>
                <span className="calendar-grid-heading-number inline-flex flex-justify-center flex-align-items-center color-norm flex-item-noshrink">
                    {day.getUTCDate()}
                </span>
            </button>
        );
    });

    return <>{result}</>;
};

export default DayButtons;
