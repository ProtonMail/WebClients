import { FREQUENCY } from 'proton-shared/lib/calendar/constants';
import { c } from 'ttag';
import { Option, SelectTwo } from 'react-components';
import { Props as SelectProps } from 'react-components/components/selectTwo/SelectTwo';
import React from 'react';

const { ONCE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM } = FREQUENCY;

interface Props extends Omit<SelectProps<FREQUENCY>, 'onChange' | 'children'> {
    value: FREQUENCY;
    onChange: (value: FREQUENCY) => void;
}

const FrequencyInput = ({ value, onChange, ...rest }: Props) => {
    const frequencies = [
        { text: c('Option').t`Does not repeat`, value: ONCE },
        { text: c('Option').t`Every day`, value: DAILY },
        { text: c('Option').t`Every week`, value: WEEKLY },
        { text: c('Option').t`Every month`, value: MONTHLY },
        { text: c('Option').t`Every year`, value: YEARLY },
        { text: c('Option').t`Custom`, value: CUSTOM },
    ];

    return (
        <SelectTwo
            value={value}
            onChange={({ value }) => {
                onChange(value as FREQUENCY);
            }}
            {...rest}
        >
            {frequencies.map(({ value, text }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

export default FrequencyInput;
