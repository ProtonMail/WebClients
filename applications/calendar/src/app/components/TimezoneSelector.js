import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getTimeZoneOptions } from 'proton-shared/lib/date/timezone';

const TimezoneSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    date,
    timezone,
    onChange,
    ...rest
}) => {
    const timezoneOptions = useMemo(() => {
        const options = getTimeZoneOptions(date || new Date());
        return options.map(({ text, value, key }) => (
            <option key={key} value={value}>
                {text}
            </option>
        ));
    }, [date]);

    return (
        <select
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select timezone`}
            value={timezone}
            onChange={({ target }) => {
                onChange(target.value);
            }}
            {...rest}
        >
            {timezoneOptions}
        </select>
    );
};

TimezoneSelector.propTypes = {
    timezone: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
    defaultTimezone: PropTypes.string,
    disabled: PropTypes.bool,
    date: PropTypes.instanceOf(Date),
    loading: PropTypes.bool
};

export default TimezoneSelector;
