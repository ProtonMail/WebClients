import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { getWeek } from './helper';

const WeekNumbers = ({ gridSize, days, numberOfWeeks }) => {
    const style = {
        display: 'grid',
        gridTemplateColumns: gridSize,
        gridTemplateRows: `repeat(${numberOfWeeks + 1}, ${gridSize})`,
        opacity: '0.3',
        textAlign: 'center'
    };

    const weekNumberLabels = useMemo(() => {
        return Array.from({ length: numberOfWeeks }, (a, i) => {
            return <span>{getWeek(days[i + i * 7])}</span>;
        });
    }, [days]);

    return (
        <div style={style}>
            <span />
            {weekNumberLabels}
        </div>
    );
};

WeekNumbers.propTypes = {
    gridSize: PropTypes.string,
    days: PropTypes.array.isRequired,
    numberOfWeeks: PropTypes.number.isRequired
};

export default WeekNumbers;
