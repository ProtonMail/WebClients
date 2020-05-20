import { c } from 'ttag';
import { Select } from 'react-components';
import { Props as SelectProps } from 'react-components/components/select/Select';
import React, { ChangeEvent } from 'react';

import { FREQUENCY } from '../../../constants';

const { ONCE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM } = FREQUENCY;

interface Props extends Omit<SelectProps, 'onChange' | 'options'> {
    value: FREQUENCY;
    onChange: (value: FREQUENCY) => void;
}

const FrequencyInput = ({ value, onChange, ...rest }: Props) => {
    const frequencies = [
        { text: c('Option').t`Do not repeat`, value: ONCE },
        { text: c('Option').t`Every day`, value: DAILY },
        { text: c('Option').t`Every week`, value: WEEKLY },
        { text: c('Option').t`Every month`, value: MONTHLY },
        { text: c('Option').t`Every year`, value: YEARLY },
        { text: c('Option').t`Custom`, value: CUSTOM },
    ];

    return (
        <Select
            value={value}
            options={frequencies}
            onChange={({ target }: ChangeEvent<HTMLSelectElement>) => {
                onChange(target.value as FREQUENCY);
            }}
            {...rest}
        />
    );
};

export default FrequencyInput;
