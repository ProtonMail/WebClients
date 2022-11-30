import { Ref, memo } from 'react';

import { classnames } from '../../helpers';
import Tooltip from '../tooltip/Tooltip';
import { WeekStartsOn } from './index.d';

export interface Props {
    weekStartsOn: WeekStartsOn;
    numberOfDays?: number;
    weekdaysLong: string[];
    weekdaysShort: string[];
    activeDateDay?: number;
    cellRef?: Ref<HTMLSpanElement>;
}

const WeekDays = ({ cellRef, weekdaysShort, weekdaysLong, weekStartsOn = 1, numberOfDays, activeDateDay }: Props) => {
    const style = {
        '--weekdays-count': numberOfDays,
    };

    return (
        <div className="text-center minicalendar-weekdays" style={style}>
            {weekdaysShort.map((el, i) => {
                const idx = (i + weekStartsOn) % 7;
                const label = weekdaysShort[idx];
                const tooltip = weekdaysLong[idx];
                const isCurrentDay = idx === activeDateDay;
                return (
                    <Tooltip key={label + i} title={tooltip}>
                        <span
                            ref={i === 0 ? cellRef : undefined}
                            aria-hidden="true"
                            className={classnames(['text-strong', isCurrentDay && 'current-weekday'])}
                        >
                            {label}
                            <span className="sr-only">{tooltip}</span>
                        </span>
                    </Tooltip>
                );
            })}
        </div>
    );
};

export default memo(WeekDays);
