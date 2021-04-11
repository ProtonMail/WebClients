import React, { useMemo } from 'react';
import { c } from 'ttag';

import { getTimeZoneOptions } from 'proton-shared/lib/date/timezone';

import { Props as SelectProps } from '../selectTwo/SelectTwo';
import { Option } from '../option';
import { SelectTwo } from '../selectTwo';

interface Props extends Omit<SelectProps<string>, 'onChange' | 'children'> {
    timezone?: string;
    onChange: (tzid: string) => void;
    className?: string;
    defaultTimezone?: string;
    disabled?: boolean;
    date?: Date;
    loading?: boolean;
}
export const TimezoneSelector = ({
    className,
    loading = false,
    disabled = false,
    date,
    timezone,
    onChange,
    ...rest
}: Props) => {
    const timezoneOptions = useMemo(() => {
        const options = getTimeZoneOptions(date || new Date());

        return options.map(({ text, value, key }) => <Option key={key} value={value} title={text} />);
    }, [date]);

    return (
        <SelectTwo
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select timezone`}
            value={timezone}
            onChange={({ value }) => {
                onChange(value);
            }}
            {...rest}
        >
            {timezoneOptions}
        </SelectTwo>
    );
};

export default TimezoneSelector;
