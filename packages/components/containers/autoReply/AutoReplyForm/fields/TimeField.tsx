import TimeInput from '@proton/components/components/input/TimeInput';

import SettingsLayout from '../../../account/SettingsLayout';
import SettingsLayoutLeft from '../../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../../account/SettingsLayoutRight';

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
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={id} className="text-semibold">
                    {label}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <TimeInput
                    id={id}
                    value={value}
                    onChange={onChange}
                    min={min}
                    preventNextDayOverflow={preventNextDayOverflow}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default TimeField;
