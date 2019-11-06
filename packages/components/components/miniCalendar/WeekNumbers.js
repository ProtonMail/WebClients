import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getWeek } from './helper';

const WeekNumbers = ({ days, numberOfWeeks }) => {
    const style = {
        '--minicalendar-weeknumbers-numberOfWeeks': numberOfWeeks + 1
    };

    const weekNumberLabels = useMemo(() => {
        return Array.from({ length: numberOfWeeks }, (a, i) => {
            const weekNumber = getWeek(days[i + i * 7]);
            return <span key={weekNumber}>{weekNumber}</span>;
        });
    }, [days]);

    return (
        <div className="aligncenter minicalendar-weeknumbers" style={style}>
            <span>
                <span className="sr-only">{c('Info').t`Week number`}</span>
            </span>
            {weekNumberLabels}
        </div>
    );
};

WeekNumbers.propTypes = {
    days: PropTypes.array.isRequired,
    numberOfWeeks: PropTypes.number.isRequired
};

export default WeekNumbers;
