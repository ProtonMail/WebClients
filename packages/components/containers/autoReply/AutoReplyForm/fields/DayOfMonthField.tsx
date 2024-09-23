import type { ChangeEvent } from 'react';

import Select from '@proton/components/components/select/Select';

import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';
import { getDaysOfMonthOptions } from '../../utils';

interface Props {
    id: string;
    label: string;
    value?: number;
    onChange: (day: number) => void;
}

const DayOfMonthField = ({ id, label, value, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={id} className="text-semibold">
                    {label}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <Select id={id} options={getDaysOfMonthOptions()} value={value} onChange={handleChange} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DayOfMonthField;
