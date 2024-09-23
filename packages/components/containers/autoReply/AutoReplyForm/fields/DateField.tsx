import { isValid } from 'date-fns';

import DateInput from '@proton/components/components/input/DateInput';

import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';

interface Props {
    id: string;
    label: string;
    value?: Date;
    min?: Date;
    max?: Date;
    onChange: (value?: Date) => void;
}

const DateField = ({ id, label, value = new Date(), onChange, min, max }: Props) => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={id} className="text-semibold">
                    {label}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <DateInput
                    id={id}
                    className="w-full"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(value) => {
                        if (isValid(value)) {
                            onChange(value);
                        }
                    }}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DateField;
