import * as React from 'react';
import { c } from 'ttag';

import { getDurationOptions } from '../../utils';
import { Select } from '../../../../components';
import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';

interface Props {
    value?: number;
    onChange: (duration: number) => void;
}

const DurationField = ({ value, onChange }: Props) => {
    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="duration" className="text-semibold">
                    {c('Label').t`Duration`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <Select id="duration" value={value} onChange={handleChange} options={getDurationOptions()} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DurationField;
