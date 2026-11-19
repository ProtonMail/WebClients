import type { ChangeEvent } from 'react';
import { useMemo } from 'react';

import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

import Select from '../../../../components/select/Select';
import AutoReplyField from './AutoReplyField';

interface Props {
    id: string;
    label: string;
    value?: number;
    onChange: (day: number) => void;
}

const DayOfWeekField = ({ id, label, value, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    const options = useMemo(() => {
        return getFormattedWeekdays('iiii', { locale: dateLocale }).map((day, index) => ({ text: day, value: index }));
    }, [dateLocale]);

    return (
        <AutoReplyField label={label} htmlFor={id}>
            <Select id={id} options={options} onChange={handleChange} value={value} />
        </AutoReplyField>
    );
};

export default DayOfWeekField;
