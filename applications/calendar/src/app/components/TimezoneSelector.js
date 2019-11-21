import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getTimeZoneOptions } from 'proton-shared/lib/date/timezone';

const TimezoneSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    nowDate = new Date(),
    timezone,
    onChange,
    ...rest
}) => {
    const defaultNowDate = useMemo(() => {
        return new Date();
    }, []);

    const actualDate = nowDate || defaultNowDate;

    const timezoneOptions = useMemo(() => {
        return getTimeZoneOptions(actualDate);
    }, [actualDate]);

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
    nowDate: PropTypes.instanceOf(Date),
    loading: PropTypes.bool
};

export default React.memo(TimezoneSelector);
