import type { ChangeEvent } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';

import AutoReplyField from './AutoReplyField';

interface Props {
    value: string;
    onChange: (timezone: string) => void;
}

const TimeZoneField = ({ value, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(target.value);

    const options = useMemo(() => {
        return getTimeZoneOptions();
    }, []);

    return (
        <AutoReplyField label={c('Label').t`Time zone`} htmlFor="timezone">
            <Select id="timezone" options={options} onChange={handleChange} value={value} />
        </AutoReplyField>
    );
};

export default TimeZoneField;
