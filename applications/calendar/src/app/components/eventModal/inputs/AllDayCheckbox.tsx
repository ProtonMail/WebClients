import React from 'react';
import { Checkbox } from '@proton/components';
import { Props as CheckboxProps } from '@proton/components/components/input/Checkbox';
import { c } from 'ttag';

interface Props extends Omit<CheckboxProps, 'onChange'> {
    checked: boolean;
    onChange: (value: boolean) => void;
}

const AllDayCheckbox = ({ checked, onChange, ...rest }: Props) => {
    return (
        <Checkbox
            id="event-allday-checkbox"
            checked={checked}
            onChange={({ target }) => onChange(target.checked)}
            {...rest}
        >
            {c('Label').t`All day`}
        </Checkbox>
    );
};

export default AllDayCheckbox;
