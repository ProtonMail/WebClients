import type { VFC } from 'react';

import type { RadioValue } from '../Controls/RadioButtonGroup';
import { RadioButtonGroupControl, type Props as RadioGroupControlProps } from '../Controls/RadioButtonGroupControl';
import { AbstractField, type AbstractFieldProps } from './AbstractField';

export const RadioButtonGroupField: VFC<AbstractFieldProps<RadioGroupControlProps>> = (props) => {
    return (
        <AbstractField<RadioGroupControlProps> {...props}>
            {(inputControlProps) => (
                <RadioButtonGroupControl
                    {...inputControlProps}
                    onValue={(value: RadioValue) => {
                        inputControlProps.onValue?.(value);
                        props.form.setFieldValue(props.field.name, value);
                    }}
                >
                    {props.children}
                </RadioButtonGroupControl>
            )}
        </AbstractField>
    );
};
