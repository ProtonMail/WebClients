import type { ComponentProps, ComponentType, ReactNode } from 'react';

import type { FieldValidator, FieldProps as FormikFieldProps } from 'formik';
import { Field as FormikField } from 'formik';

type Props<T extends FormikFieldProps> = {
    autofillable?: boolean;
    component: ComponentType<T>;
    name: string;
    validate?: FieldValidator;
    children?: ReactNode;
} & (T extends infer U ? Omit<ComponentProps<ComponentType<U>>, keyof FormikFieldProps> : never);

export const Field = <T extends FormikFieldProps>({ autofillable = false, ...props }: Props<T>) => (
    <FormikField {...props} {...(!autofillable ? { 'data-protonpass-ignore': true } : {})} />
);
