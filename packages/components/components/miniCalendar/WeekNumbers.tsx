import React, { useMemo } from 'react';
import { c } from 'ttag';
import { getISOWeek } from 'date-fns';

export interface Props {
    days: Date[];
    numberOfWeeks: number;
}

const getMonday = (days: Date[], start: number, end: number) => {
    for (let i = start; i < end; ++i) {
        const day = days[i];
        if (day && day.getDay() === 1) {
            return day;
        }
    }
};

const WeekNumbers = ({ days, numberOfWeeks }: Props) => {
    const style = {
        '--minicalendar-weeknumbers-numberOfWeeks': numberOfWeeks + 1,
    };

    const weekNumberLabels = useMemo(() => {
        return Array.from({ length: numberOfWeeks }, (a, i) => {
            const idx = i * 7;
            const monday = getMonday(days, idx, idx + 7) || days[idx];
            const weekNumber = getISOWeek(monday);
            return (
                <span className="text-italic flex-item-fluid flex minicalendar-weeknumbers-number" key={+monday}>
                    <span className="mauto">{weekNumber}</span>
                </span>
            );
        });
    }, [days]);

    return (
        <div className="text-center minicalendar-weeknumbers flex flex-column" style={style}>
            <span>
                <span className="minicalendar-weeknumbers-heading">{c('Info').t`Week`}</span>
            </span>
            {weekNumberLabels}
        </div>
    );
};

export default WeekNumbers;
