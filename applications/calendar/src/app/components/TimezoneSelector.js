import React from 'react';
import PropTypes from 'prop-types';
import { listTimeZones } from 'timezone-support';

const TimezoneSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    timezone,
    updateTimezone,
    ...rest
}) => {
    const options = listTimeZones().map((text) => ({ text, value: text }));
    return (
        <select
            disabled={loading || disabled}
            className={className}
            value={timezone}
            onChange={({ target }) => updateTimezone(target.value)}
            {...rest}
        >
            {options.map(({ text, value }) => {
                return (
                    <option key={value} value={value}>
                        {text}
                    </option>
                );
            })}
        </select>
    );
};

TimezoneSelector.propTypes = {
    timezone: PropTypes.string,
    updateTimezone: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
};

export default TimezoneSelector;
