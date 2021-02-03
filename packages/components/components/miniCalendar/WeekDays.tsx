import React, { useMemo } from 'react';
import { WeekStartsOn } from './index.d';

import Tooltip from '../tooltip/Tooltip';

export interface Props {
    weekStartsOn: WeekStartsOn;
    numberOfDays?: number;
    weekdaysLong: string[];
    weekdaysShort: string[];
}

const WeekDays = ({ weekdaysShort, weekdaysLong, weekStartsOn = 1, numberOfDays }: Props) => {
    const style = {
        '--minicalendar-weekdays-numberOfDaysInWeek': numberOfDays,
    };

    const weekDaysLabels = useMemo(() => {
        return weekdaysShort.map((el, i) => {
            const idx = (i + weekStartsOn) % 7;
            const label = weekdaysShort[idx];
            const tooltip = weekdaysLong[idx];
            return (
                <Tooltip key={label + i} title={tooltip}>
                    <span aria-hidden="true">{label}</span>
                    <span className="sr-only">{tooltip}</span>
                </Tooltip>
            );
        });
    }, [weekdaysShort, weekStartsOn]);

    return (
        <div className="text-center minicalendar-weekdays" style={style}>
            {weekDaysLabels}
        </div>
    );
};

export default WeekDays;
