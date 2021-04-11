import React from 'react';
import { isValid } from 'date-fns';
import { DateInput } from '../../../../components';
import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';

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
                    className="w100"
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
