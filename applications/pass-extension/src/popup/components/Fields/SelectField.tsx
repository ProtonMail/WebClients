import type { VFC } from 'react';

import { SelectControl, Props as SelectControlProps } from '../Controls/SelectControl';
import { AbstractField, type AbstractFieldProps } from './AbstractField';

export const SelectField: VFC<AbstractFieldProps<SelectControlProps>> = (props) => {
    return (
        <AbstractField<SelectControlProps> {...props}>
            {(inputControlProps) => (
                <SelectControl
                    {...inputControlProps}
                    onChange={undefined}
                    onValue={(value: unknown) => {
                        inputControlProps.onValue?.(value);
                        props.form.setFieldValue(props.field.name, value);
                    }}
                >
                    {props.children}
                </SelectControl>
            )}
        </AbstractField>
    );
};
