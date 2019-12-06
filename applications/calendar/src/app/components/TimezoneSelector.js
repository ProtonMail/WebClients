import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getTimeZoneOptions } from 'proton-shared/lib/date/timezone';

const TimezoneSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    currentDate,
    timezone,
    onChange,
    ...rest
}) => {
    const timezoneOptions = useMemo(() => {
        return getTimeZoneOptions(currentDate || new Date());
    }, [currentDate]);

    return (
        <select
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select timezone`}
            value={timezone}
            onChange={({ target }) => {
                // Just having undefined does not work
                onChange(target.value === 'default' ? undefined : target.value);
            }}
            {...rest}
        >
            {timezoneOptions.map(({ text, value, key }) => {
                return (
                    <option key={key} value={value}>
                        {text}
                    </option>
                );
            })}
        </select>
    );
};

TimezoneSelector.propTypes = {
    timezone: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
    defaultTimezone: PropTypes.string,
    disabled: PropTypes.bool,
    currentDate: PropTypes.instanceOf(Date),
    loading: PropTypes.bool
};

export default React.memo(TimezoneSelector);
