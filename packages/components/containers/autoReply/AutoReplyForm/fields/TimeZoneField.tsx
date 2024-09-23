import type { ChangeEvent } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';

import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';

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
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="timezone" className="text-semibold">
                    {c('Label').t`Time zone`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <Select id="timezone" options={options} onChange={handleChange} value={value} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default TimeZoneField;
