import React, { useMemo } from 'react';
import { c } from 'ttag';
import { Row } from 'react-components';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';

import DayCheckbox from '../inputs/DayCheckbox';
import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';
import { WEEKLY_TYPE } from '../../../constants';
import { WeekStartsOn } from '../../../containers/calendar/interface';

const DAYS = Array.from({ length: 7 }, (a, i) => i);

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    weekStartsOn: WeekStartsOn;
    onChange: (value: FrequencyModel) => void;
    collapseOnMobile?: boolean;
}
const RepeatOnRow = ({ frequencyModel, start, weekStartsOn, onChange }: Props) => {
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
        <>
            <Row>
                <div className="mr1 flex flex-items-center"><label htmlFor="event-custom-frequency-select">{c('Label').t`Repeat on`}</label></div>
                <div className="flex flex-nowrap flex-item-fluid">
                    {DAYS.map((dayIndex) => {
                        const day = (dayIndex + weekStartsOn) % 7;
                        const dayLong = weekdaysLong[day];
                        const dayAbbreviation = weekdaysAbbreviations[day];
                        const checked = frequencyModel.weekly.days.includes(day);
                        return (
                            <span key={day.toString()}>
                                <DayCheckbox
                                    id={dayLong}
                                    checked={checked}
                                    dayAbbreviation={dayAbbreviation}
                                    dayLong={dayLong}
                                    onChange={() => handleToggleDay(day)}
                                />
                            </span>
                        );
                    })}
                </div>
            </Row>
        </>
    );
};

export default RepeatOnRow;
