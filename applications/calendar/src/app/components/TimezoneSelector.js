import React from 'react';
import PropTypes from 'prop-types';
import { listTimeZones, findTimeZone, getZonedTime } from 'timezone-support';
import { c } from 'ttag';

const TimezoneSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    timezone,
    onChangeTimezone,
    ...rest
}) => {
    const date = new Date();
    const options = listTimeZones().map((tz) => {
        const { zone = {} } = getZonedTime(date, findTimeZone(tz));
        return {
            text: `${tz} ${zone.abbreviation}`,
            value: tz
        };
    });
    return (
        <select
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select timezone`}
            value={timezone}
            onChange={({ target }) => onChangeTimezone(target.value)}
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
    onChangeTimezone: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
};

export default TimezoneSelector;
