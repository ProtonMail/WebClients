import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const WeekDays = ({ weekdays, weekStartsOn, gridSize, numberOfDays }) => {
    const style = {
        display: 'grid',
        gridTemplateColumns: `repeat(${numberOfDays}, ${gridSize})`,
        gridTemplateRows: gridSize,
        opacity: '0.3',
        textAlign: 'center'
    };

    const weekDaysLabels = useMemo(() => {
        return weekdays.map((el, i) => {
            const label = weekdays[(i + weekStartsOn) % 7];
            return <span key={label + i}>{label}</span>;
        });
    }, [weekdays, weekStartsOn]);

    return <div style={style}>{weekDaysLabels}</div>;
};

WeekDays.propTypes = {
    gridSize: PropTypes.string,
    numberOfDays: PropTypes.number.isRequired,
    weekStartsOn: PropTypes.number.isRequired,
    weekdays: PropTypes.array.isRequired
};

export default WeekDays;
