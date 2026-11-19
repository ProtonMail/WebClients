import type { ChangeEvent } from 'react';

import Select from '../../../../components/select/Select';
import { getDaysOfMonthOptions } from '../../utils';
import AutoReplyField from './AutoReplyField';

interface Props {
    id: string;
    label: string;
    value?: number;
    onChange: (day: number) => void;
}

const DayOfMonthField = ({ id, label, value, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    return (
        <AutoReplyField label={label} htmlFor={id}>
            <Select id={id} options={getDaysOfMonthOptions()} value={value} onChange={handleChange} />
        </AutoReplyField>
    );
};

export default DayOfMonthField;
