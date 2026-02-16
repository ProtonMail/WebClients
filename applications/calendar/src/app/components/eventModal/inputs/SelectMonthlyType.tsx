import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { MONTHLY_TYPE } from '@proton/shared/lib/calendar/constants';
import capitalize from '@proton/utils/capitalize';

import useMonthlyOptions from './useMonthlyOptions';

interface Props {
    value: MONTHLY_TYPE;
    date: Date;
    onChange: (value: MONTHLY_TYPE) => void;
}

const SelectMonthlyType = ({ value, date, onChange }: Props) => {
    const options = useMonthlyOptions(date);

    return (
        <div className="flex flex-column gap-4">
            <RadioGroup
                name="selected-shape"
                className="mb-0"
                onChange={(value) => {
                    const newValue = +value as MONTHLY_TYPE;
                    onChange?.(newValue);
                }}
                value={value}
                options={options.map((option) => ({ value: option.value, label: capitalize(option.text) }))}
            />
        </div>
    );
};

export default SelectMonthlyType;
