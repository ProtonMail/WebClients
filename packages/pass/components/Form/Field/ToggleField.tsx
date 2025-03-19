import { type FieldProps } from 'formik';

import { Toggle } from '@proton/components';
import type { ToggleProps } from '@proton/components/components/toggle/Toggle';

type ToggleGroupFieldProps = FieldProps & ToggleProps;

export const ToggleField = ({ field, form, meta, onChange, ...props }: ToggleGroupFieldProps) => {
    return (
        <Toggle
            {...field}
            {...props}
            onChange={async ({ target: { checked } }) => {
                await form.setFieldValue(field.name, checked);
            }}
        />
    );
};
