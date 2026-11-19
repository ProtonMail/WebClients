import TimeInput from '../../../../components/input/TimeInput';
import AutoReplyField from './AutoReplyField';

interface Props {
    id: string;
    label: string;
    value?: Date;
    onChange: (date: Date) => void;
    min?: Date;
    preventNextDayOverflow?: boolean;
}

const TimeField = ({ id, label, value = new Date(), onChange, min, preventNextDayOverflow }: Props) => {
    return (
        <AutoReplyField label={label} htmlFor={id}>
            <TimeInput
                id={id}
                value={value}
                onChange={onChange}
                min={min}
                preventNextDayOverflow={preventNextDayOverflow}
            />
        </AutoReplyField>
    );
};

export default TimeField;
