import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

import AutoReplyField from './AutoReplyField';

interface Props {
    value?: number[];
    onChange: (days: number[]) => void;
}

const DaysOfWeekField = ({ value = [], onChange }: Props) => {
    const handleChange = (weekday: number) => () =>
        onChange(value.includes(weekday) ? value.filter((existing) => weekday !== existing) : [...value, weekday]);

    return (
        <AutoReplyField label={c('Label').t`Days of the week`} labelId="label-days-of-week">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 pt-1">
                {getFormattedWeekdays('iiii', { locale: dateLocale }).map((text, i) => (
                    <Checkbox
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
        </AutoReplyField>
    );
};

export default DaysOfWeekField;
