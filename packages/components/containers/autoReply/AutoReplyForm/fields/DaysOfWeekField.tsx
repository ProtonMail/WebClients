import { c } from 'ttag';

import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

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
                <span id="label-days-of-week" className="label text-semibold">{c('Label').t`Days of the week`}</span>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <div className="flex flex-column pt0-25">
                    {getFormattedWeekdays('iiii', { locale: dateLocale }).map((text, i) => (
                        <Checkbox
                            className="mb0-25"
                            id={`weekday-${i}`}
                            key={text}
                            checked={value.includes(i)}
                            onChange={handleChange(i)}
                            aria-describedby="label-days-of-week"
                        >
                            {text}
                        </Checkbox>
                    ))}
                </div>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DaysOfWeekField;
