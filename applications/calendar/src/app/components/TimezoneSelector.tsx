import React, { ChangeEvent, useMemo } from 'react';
import { c } from 'ttag';
import { getTimeZoneOptions } from 'proton-shared/lib/date/timezone';

interface Props {
    timezone?: string;
    onChange: (tzid: string) => void;
    className?: string;
    defaultTimezone?: string;
    disabled?: boolean;
    date?: Date;
    loading?: boolean;
}
const TimezoneSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    date,
    timezone,
    onChange,
    ...rest
}: Props) => {
    const timezoneOptions = useMemo(() => {
        const options = getTimeZoneOptions(date || new Date()) as any[];
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
            onChange={({ target }: ChangeEvent<HTMLSelectElement>) => {
                onChange(target.value);
            }}
            {...rest}
        >
            {timezoneOptions}
        </select>
    );
};

export default TimezoneSelector;
