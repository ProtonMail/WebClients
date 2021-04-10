import React from 'react';
import { c } from 'ttag';

import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';

import { Checkbox } from '../../../../components';
import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';

interface Props {
    value?: number[];
    onChange: (days: number[]) => void;
}

const DaysOfWeekField = ({ value = [], onChange }: Props) => {
    const handleChange = (weekday: number) => () =>
        onChange(value.includes(weekday) ? value.filter((existing) => weekday !== existing) : [...value, weekday]);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold">{c('Label').t`Days of the week`}</label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <div className="flex flex-column">
                    {getFormattedWeekdays('iiii', { locale: dateLocale }).map((text, i) => (
                        <Checkbox id={`weekday-${i}`} key={text} checked={value.includes(i)} onChange={handleChange(i)}>
                            {text}
                        </Checkbox>
                    ))}
                </div>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DaysOfWeekField;
