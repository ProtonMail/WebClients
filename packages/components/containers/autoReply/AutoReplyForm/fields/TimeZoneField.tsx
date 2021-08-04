import { useMemo } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';

import { Select } from '../../../../components';
import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';

interface Props {
    value: string;
    onChange: (timezone: string) => void;
}

const TimeZoneField = ({ value, onChange }: Props) => {
    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => onChange(target.value);

    const options = useMemo(() => {
        return getTimeZoneOptions();
    }, []);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="timezone" className="text-semibold">
                    {c('Label').t`Timezone`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <Select id="timezone" options={options} onChange={handleChange} value={value} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default TimeZoneField;
