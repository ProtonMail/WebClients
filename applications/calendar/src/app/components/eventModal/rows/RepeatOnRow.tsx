import { useMemo } from 'react';

import { c } from 'ttag';

import { WEEKLY_TYPE } from '@proton/shared/lib/calendar/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';
import { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import DayCheckbox from '../inputs/DayCheckbox';

const DAYS = Array.from({ length: 7 }, (a, i) => i);

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    weekStartsOn: WeekStartsOn;
    onChange: (value: FrequencyModel) => void;
    displayStacked?: boolean;
}
const RepeatOnRow = ({ frequencyModel, start, weekStartsOn, onChange, displayStacked = false }: Props) => {
    const [weekdaysLong, weekdaysAbbreviations] = useMemo(() => {
        return ['cccc', 'cccccc'].map((format) => getFormattedWeekdays(format, { locale: dateLocale }));
    }, [dateLocale]);
    const currentDay = start.date.getDay();

    const handleToggleDay = (day: number) => {
        if (day === currentDay) {
            // do not allow to toggle current day
            return;
        }
        const selectedDays = frequencyModel.weekly.days || [currentDay];
        if (selectedDays.includes(day)) {
            const newDays = selectedDays.filter((selectedDay) => selectedDay !== day);
            return onChange({ ...frequencyModel, weekly: { type: WEEKLY_TYPE.ON_DAYS, days: newDays } });
        }
        onChange({ ...frequencyModel, weekly: { type: WEEKLY_TYPE.ON_DAYS, days: selectedDays.concat(day).sort() } });
    };

    return (
        <div className={clsx('mb-2 ml-0', !displayStacked && 'md:ml-2')}>
            <label className={clsx(displayStacked && 'text-semibold')} id="label-event-weekly-repeat">{c('Label')
                .t`Repeat on`}</label>
            <div className="flex gap-2">
                {DAYS.map((dayIndex) => {
                    const day = (dayIndex + weekStartsOn) % 7;
                    const dayLong = weekdaysLong[day];
                    const dayAbbreviation = weekdaysAbbreviations[day];
                    const checked = frequencyModel.weekly.days.includes(day);
                    return (
                        <DayCheckbox
                            key={day.toString()}
                            id={dayLong}
                            checked={checked}
                            dayAbbreviation={dayAbbreviation}
                            dayLong={day === currentDay ? c('Tooltip').t`Change start date to unselect` : dayLong}
                            onChange={() => handleToggleDay(day)}
                            aria-describedby="label-event-weekly-repeat"
                            disabled={day === currentDay}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RepeatOnRow;
