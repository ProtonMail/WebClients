import type { ReactNode } from 'react';

import type { FieldProps } from 'formik';

import { InputControlProps } from '../Controls/InputControl';

export type AbstractFieldProps<T extends InputControlProps> = T & FieldProps;

export const AbstractField = <T extends InputControlProps>(
    props: Omit<AbstractFieldProps<T>, 'children'> & { children: (props: T) => ReactNode }
) => {
    const { field, form, meta, children, ...rest } = props;

    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];
    const status = error ? 'error' : 'default';
    const inputControlProps = { ...field, ...rest, status, error } as InputControlProps;

    return <>{children(inputControlProps)}</>;
};
