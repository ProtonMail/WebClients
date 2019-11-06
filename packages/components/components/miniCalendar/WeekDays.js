import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip/Tooltip';

const WeekDays = ({ weekdaysShort, weekdaysLong, weekStartsOn, numberOfDays }) => {
    const style = {
        '--minicalendar-weekdays-numberOfDaysInWeek': numberOfDays
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
        <div className="aligncenter minicalendar-weekdays" style={style}>
            {weekDaysLabels}
        </div>
    );
};

WeekDays.propTypes = {
    numberOfDays: PropTypes.number.isRequired,
    weekStartsOn: PropTypes.number.isRequired,
    weekdaysShort: PropTypes.array.isRequired,
    weekdaysLong: PropTypes.array.isRequired
};

export default WeekDays;
