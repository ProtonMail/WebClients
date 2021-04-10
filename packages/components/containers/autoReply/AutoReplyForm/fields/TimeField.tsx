import React from 'react';

import { TimeInput } from '../../../../components';
import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';

interface Props {
    id: string;
    label: string;
    value?: Date;
    onChange: (date: Date) => void;
}

const TimeField = ({ id, label, value = new Date(), onChange }: Props) => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={id} className="text-semibold">
                    {label}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <TimeInput id={id} value={value} onChange={onChange} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default TimeField;
