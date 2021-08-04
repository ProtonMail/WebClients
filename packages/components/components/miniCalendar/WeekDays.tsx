import { useMemo } from 'react';
import { WeekStartsOn } from './index.d';

import Tooltip from '../tooltip/Tooltip';
import { classnames } from '../../helpers';

export interface Props {
    weekStartsOn: WeekStartsOn;
    numberOfDays?: number;
    weekdaysLong: string[];
    weekdaysShort: string[];
    activeDateDay?: number;
}

const WeekDays = ({ weekdaysShort, weekdaysLong, weekStartsOn = 1, numberOfDays, activeDateDay }: Props) => {
    const style = {
        '--weekdays-count': numberOfDays,
    };

    const weekDaysLabels = useMemo(() => {
        return weekdaysShort.map((el, i) => {
            const idx = (i + weekStartsOn) % 7;
            const label = weekdaysShort[idx];
            const tooltip = weekdaysLong[idx];
            const isCurrentDay = idx === activeDateDay;
            return (
                <Tooltip key={label + i} title={tooltip}>
                    <span aria-hidden="true" className={classnames(['text-strong', isCurrentDay && 'color-primary'])}>
                        {label}
                        <span className="sr-only">{tooltip}</span>
                    </span>
                </Tooltip>
            );
        });
    }, [weekdaysShort, weekStartsOn, activeDateDay]);

    return (
        <div className="text-center minicalendar-weekdays" style={style}>
            {weekDaysLabels}
        </div>
    );
};

export default WeekDays;
