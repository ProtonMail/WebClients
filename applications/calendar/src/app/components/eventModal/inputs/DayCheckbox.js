import React from 'react';
import PropTypes from 'prop-types';

const DayCheckbox = ({ id, dayAbbreviation, dayLong, onClick, ...rest }) => {
    return (
        <label htmlFor={id} onClick={onClick} className="mr1 inline-flex">
            <input id={id} type="checkbox" className="day-checkbox sr-only" {...rest} />
            <span className="day-icon flex-item-noshrink rounded50 inline-flex mr1-5">
                <span className="mauto item-abbr" aria-hidden="true">
                    {dayAbbreviation}
                </span>
                <span className="sr-only">{dayLong}</span>
            </span>
        </label>
    );
};

DayCheckbox.propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
    dayAbr: PropTypes.string,
    dayLong: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node
};

export default DayCheckbox;
