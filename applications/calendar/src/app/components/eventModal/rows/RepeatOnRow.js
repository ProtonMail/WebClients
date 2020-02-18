import React, { useMemo } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row } from 'react-components';

import DayCheckbox from '../inputs/DayCheckbox';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';

const DAYS = Array.from({ length: 7 }, (a, i) => i);

const RepeatOnRow = ({ frequencyModel, start, weekStartsOn, onChange, collapseOnMobile }) => {
    const [weekdaysLong, weekdaysAbbreviations] = useMemo(() => {
        return ['cccc', 'ccccc'].map((format) => getFormattedWeekdays(format, { locale: dateLocale }));
    }, [dateLocale]);
    const currentDay = start.date.getDay();

    const handleToggleDay = (day) => {
        if (day === currentDay) {
            // do not allow to toggle current day
            return;
        }
        const selectedDays = frequencyModel.weekly.days || [currentDay];
        if (selectedDays.includes(day)) {
            const newDays = selectedDays.filter((selectedDay) => selectedDay !== day);
            return onChange({ ...frequencyModel, weekly: { days: newDays } });
        }
        onChange({ ...frequencyModel, weekly: { days: selectedDays.concat(day).sort() } });
    };

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <label htmlFor="event-custom-frequency-select">{c('Label').t`Repeat on`}</label>
            </Row>
            <Row>
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

RepeatOnRow.propTypes = {
    frequencyModel: PropTypes.object,
    start: PropTypes.object,
    weekStartsOn: PropTypes.number,
    onChange: PropTypes.func,
    collapseOnMobile: PropTypes.bool
};

export default RepeatOnRow;
