import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';

import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';
import { getDurationOptions } from '../../utils';

interface Props {
    value?: number;
    onChange: (duration: number) => void;
}

const DurationField = ({ value, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

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
