import { isValid } from 'date-fns';

import DateInput from '@proton/components/components/input/DateInput';

import AutoReplyField from './AutoReplyField';

interface Props {
    id: string;
    label: string;
    value?: Date;
    min?: Date;
    max?: Date;
    fullWidth?: boolean;
    onChange: (value?: Date) => void;
}

const DateField = ({ id, label, value = new Date(), onChange, min, max, fullWidth = true }: Props) => {
    return (
        <AutoReplyField label={label} htmlFor={id}>
            <DateInput
                id={id}
                className={fullWidth ? 'w-full' : ''}
                min={min}
                max={max}
                value={value}
                onChange={(value) => {
                    if (isValid(value)) {
                        onChange(value);
                    }
                }}
            />
        </AutoReplyField>
    );
};

export default DateField;
