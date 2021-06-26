import React, { useMemo } from 'react';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Select } from '../../../../components';
import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';

interface Props {
    id: string;
    label: string;
    value?: number;
    onChange: (day: number) => void;
}

const DayOfWeekField = ({ id, label, value, onChange }: Props) => {
    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    const options = useMemo(() => {
        return getFormattedWeekdays('iiii', { locale: dateLocale }).map((day, index) => ({ text: day, value: index }));
    }, [dateLocale]);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={id} className="text-semibold">
                    {label}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <Select id={id} options={options} onChange={handleChange} value={value} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DayOfWeekField;
