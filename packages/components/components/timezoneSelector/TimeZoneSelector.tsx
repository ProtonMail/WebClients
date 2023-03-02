import { useMemo } from 'react';

import { c } from 'ttag';

import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';

import { Option } from '../option';
import { SearchableSelect } from '../selectTwo';
import { Props as SelectProps } from '../selectTwo/SelectTwo';

interface Props extends Omit<SelectProps<string>, 'onChange' | 'children'> {
    timezone?: string;
    onChange: (tzid: string) => void;
    className?: string;
    defaultTimezone?: string;
    disabled?: boolean;
    date?: Date;
    loading?: boolean;
}
export const TimeZoneSelector = ({ loading = false, disabled = false, date, timezone, onChange, ...rest }: Props) => {
    const timezoneOptions = useMemo(() => {
        const options = getTimeZoneOptions(date || new Date());

        return options.map(({ text, value, key }) => <Option key={key} value={value} title={text} />);
    }, [date]);

    return (
        <SearchableSelect
            disabled={loading || disabled}
            title={c('Action').t`Select time zone`}
            value={timezone}
            onChange={({ value }) => {
                onChange(value);
            }}
            search
            searchPlaceholder={c('Timezone search placeholder').t`Search time zones`}
            {...rest}
        >
            {timezoneOptions}
        </SearchableSelect>
    );
};

export default TimeZoneSelector;
